import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { canBotModerate, canModerate } from "../../../core/permissions/hierarchy";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import { formatDurationMs, parseDurationMs } from "../../../core/utils/duration";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { auditReason, notifyTarget, recordCase } from "../services/moderationService";

const KEY = "moderation.commands.timeout";
const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => localizeOption(option, `${KEY}.options.user`).setRequired(true))
    .addStringOption((option) =>
      localizeOption(option, `${KEY}.options.duration`).setRequired(true),
    )
    .addStringOption((option) => localizeOption(option, `${KEY}.options.reason`)),

  async execute(interaction, _client, t) {
    const guild = interaction.guild!;
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? undefined;
    const durationMs = parseDurationMs(interaction.options.getString("duration", true));

    if (durationMs <= 0 || durationMs > MAX_TIMEOUT_MS) {
      throw new GauliaError("moderation.errors.timeoutRange");
    }

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

    await targetMember.timeout(durationMs, await auditReason(guild, reason, interaction.user.tag));
    await notifyTarget(guild, targetUser, "TIMEOUT", reason);

    const moderationCase = await recordCase({
      guild,
      type: "TIMEOUT",
      target: { id: targetUser.id, tag: targetUser.tag },
      moderator: { id: interaction.user.id, tag: interaction.user.tag },
      reason,
      durationSecs: Math.round(durationMs / 1000),
    });

    await interaction.reply(
      successPayload(
        false,
        t("moderation.timeout.title", { case: moderationCase.caseNumber }),
        t("moderation.timeout.description", {
          target: targetUser.tag,
          duration: formatDurationMs(durationMs, t),
        }) + (reason ? `\n${t("moderation.case.reason", { reason })}` : ""),
      ),
    );
  },
};

export default command;
