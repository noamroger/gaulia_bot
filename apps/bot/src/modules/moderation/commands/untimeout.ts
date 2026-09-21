import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { auditReason, notifyTarget, recordCase } from "../services/moderationService";

const KEY = "moderation.commands.untimeout";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => localizeOption(option, `${KEY}.options.user`).setRequired(true))
    .addStringOption((option) => localizeOption(option, `${KEY}.options.reason`)),

  async execute(interaction, _client, t) {
    const guild = interaction.guild!;
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? undefined;

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      throw new GauliaError("moderation.errors.memberNotInGuild");
    }

    if (!targetMember.isCommunicationDisabled()) {
      throw new GauliaError("moderation.errors.notTimedOut");
    }

    await targetMember.timeout(null, await auditReason(guild, reason, interaction.user.tag));
    await notifyTarget(guild, targetUser, "UNTIMEOUT", reason);

    const moderationCase = await recordCase({
      guild,
      type: "UNTIMEOUT",
      target: { id: targetUser.id, tag: targetUser.tag },
      moderator: { id: interaction.user.id, tag: interaction.user.tag },
      reason,
    });

    await interaction.reply(
      successPayload(
        false,
        t("moderation.untimeout.title", { case: moderationCase.caseNumber }),
        t("moderation.untimeout.description", { target: targetUser.tag }),
      ),
    );
  },
};

export default command;
