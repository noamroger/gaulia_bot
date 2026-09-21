import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { canBotModerate, canModerate } from "../../../core/permissions/hierarchy";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { auditReason, notifyTarget, recordCase } from "../services/moderationService";

const KEY = "moderation.commands.ban";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) => localizeOption(option, `${KEY}.options.user`).setRequired(true))
    .addStringOption((option) => localizeOption(option, `${KEY}.options.reason`))
    .addIntegerOption((option) =>
      localizeOption(option, `${KEY}.options.deleteMessageDays`).setMinValue(0).setMaxValue(7),
    ),

  async execute(interaction, _client, t) {
    const guild = interaction.guild!;
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? undefined;
    const deleteDays = interaction.options.getInteger("delete_message_days") ?? 0;

    const moderatorMember = await guild.members.fetch(interaction.user.id);
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (targetMember) {
      const modCheck = canModerate(moderatorMember, targetMember);
      if (!modCheck.allowed) throw new GauliaError(modCheck.reasonKey!);

      const botMember = await guild.members.fetchMe();
      const botCheck = canBotModerate(botMember, targetMember);
      if (!botCheck.allowed) throw new GauliaError(botCheck.reasonKey!);

      await notifyTarget(guild, targetUser, "BAN", reason);
    }

    await guild.bans.create(targetUser.id, {
      reason: await auditReason(guild, reason, interaction.user.tag),
      deleteMessageSeconds: deleteDays * 86_400,
    });

    const moderationCase = await recordCase({
      guild,
      type: "BAN",
      target: { id: targetUser.id, tag: targetUser.tag },
      moderator: { id: interaction.user.id, tag: interaction.user.tag },
      reason,
    });

    await interaction.reply(
      successPayload(
        false,
        t("moderation.ban.title", { case: moderationCase.caseNumber }),
        t("moderation.ban.description", { target: targetUser.tag }) +
          (reason ? `\n${t("moderation.case.reason", { reason })}` : ""),
      ),
    );
  },
};

export default command;
