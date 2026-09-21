import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { canModerate } from "../../../core/permissions/hierarchy";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { escalationLine, performWarn } from "../services/moderationService";

const KEY = "moderation.commands.warn";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => localizeOption(option, `${KEY}.options.user`).setRequired(true))
    .addStringOption((option) => localizeOption(option, `${KEY}.options.reason`).setRequired(true)),

  async execute(interaction, _client, t) {
    const guild = interaction.guild!;
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);

    const moderatorMember = await guild.members.fetch(interaction.user.id);
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (targetMember) {
      const modCheck = canModerate(moderatorMember, targetMember);
      if (!modCheck.allowed) throw new GauliaError(modCheck.reasonKey!);
    }

    const { moderationCase, escalation } = await performWarn(
      guild,
      targetUser,
      { id: interaction.user.id, tag: interaction.user.tag },
      reason,
    );

    await interaction.reply(
      successPayload(
        false,
        t("moderation.warn.title", { case: moderationCase.caseNumber }),
        [
          t("moderation.warn.description", { target: targetUser.tag }),
          t("moderation.case.reason", { reason }),
        ].join("\n") + escalationLine(escalation, t),
      ),
    );
  },
};

export default command;
