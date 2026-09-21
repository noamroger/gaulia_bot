import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { canBotModerate, canModerate } from "../../../core/permissions/hierarchy";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { auditReason, notifyTarget, recordCase } from "../services/moderationService";

const KEY = "moderation.commands.kick";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) => localizeOption(option, `${KEY}.options.user`).setRequired(true))
    .addStringOption((option) => localizeOption(option, `${KEY}.options.reason`)),

  async execute(interaction, _client, t) {
    const guild = interaction.guild!;
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? undefined;

    const moderatorMember = await guild.members.fetch(interaction.user.id);
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      throw new GauliaError("moderation.errors.memberNotInGuild");
    }

    const modCheck = canModerate(moderatorMember, targetMember);
    if (!modCheck.allowed) throw new GauliaError(modCheck.reasonKey!);

    const botMember = await guild.members.fetchMe();
    const botCheck = canBotModerate(botMember, targetMember);
    if (!botCheck.allowed) throw new GauliaError(botCheck.reasonKey!);

    await notifyTarget(guild, targetUser, "KICK", reason);
    await targetMember.kick(await auditReason(guild, reason, interaction.user.tag));

    const moderationCase = await recordCase({
      guild,
      type: "KICK",
      target: { id: targetUser.id, tag: targetUser.tag },
      moderator: { id: interaction.user.id, tag: interaction.user.tag },
      reason,
    });

    await interaction.reply(
      successPayload(
        false,
        t("moderation.kick.title", { case: moderationCase.caseNumber }),
        t("moderation.kick.description", { target: targetUser.tag }) +
          (reason ? `\n${t("moderation.case.reason", { reason })}` : ""),
      ),
    );
  },
};

export default command;
