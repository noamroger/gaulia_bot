import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { auditReason, recordCase } from "../services/moderationService";

const KEY = "moderation.commands.unban";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) => localizeOption(option, `${KEY}.options.userId`).setRequired(true))
    .addStringOption((option) => localizeOption(option, `${KEY}.options.reason`)),

  async execute(interaction, _client, t) {
    const guild = interaction.guild!;
    const userId = interaction.options.getString("user_id", true);
    const reason = interaction.options.getString("reason") ?? undefined;

    const ban = await guild.bans.fetch(userId).catch(() => null);
    if (!ban) {
      throw new GauliaError("moderation.errors.notBanned");
    }

    await guild.bans.remove(userId, await auditReason(guild, reason, interaction.user.tag));

    const moderationCase = await recordCase({
      guild,
      type: "UNBAN",
      target: { id: userId, tag: ban.user.tag },
      moderator: { id: interaction.user.id, tag: interaction.user.tag },
      reason,
    });

    await interaction.reply(
      successPayload(
        false,
        t("moderation.unban.title", { case: moderationCase.caseNumber }),
        t("moderation.unban.description", { target: ban.user.tag }),
      ),
    );
  },
};

export default command;
