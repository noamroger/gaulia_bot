import {
  countActiveWarns,
  createModerationCase,
  createWarn,
  getModerationSettings,
  getOrCreateGuild,
  getUserLanguage,
  type EscalationStep,
  type SanctionType,
} from "@gaulia/database";
import type { ModerationCase, ModerationCaseType } from "@prisma/client";
import type { Guild, GuildMember, User } from "discord.js";

import { Colors, Emojis } from "../../../client/Constants";
import { logger } from "../../../client/logger";
import { canBotModerate } from "../../../core/permissions/hierarchy";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import { formatDurationMs } from "../../../core/utils/duration";
import {
  createTranslator,
  guildTranslatorFor,
  readStoredLocale,
  type Translator,
} from "../../../i18n";

const TYPE_COLORS: Record<ModerationCaseType, number> = {
  BAN: Colors.Danger,
  UNBAN: Colors.Success,
  KICK: Colors.Danger,
  TIMEOUT: Colors.Warning,
  UNTIMEOUT: Colors.Success,
  WARN: Colors.Warning,
  UNWARN: Colors.Success,
  PURGE: Colors.Neutral,
};

export interface ModeratorRef {
  id: string;
  tag: string;
}

export interface RecordCaseInput {
  guild: Guild;
  type: ModerationCaseType;
  target: ModeratorRef;
  moderator: ModeratorRef;
  reason?: string | undefined;
  durationSecs?: number | undefined;
}

export interface MemberSanction {
  type: "timeout" | "kick" | "ban";
  timeoutMinutes: number;
}

export interface WarnResult {
  moderationCase: ModerationCase;
  /** Escalation step this warning triggered, when there is one. */
  escalation: EscalationStep | null;
}

/**
 * Mod log entries, audit log reasons and reasons stored on a case are read by the guild staff, so
 * they follow the guild language rather than the language of whoever triggered the action.
 */
function guildTranslator(guild: Guild): Promise<Translator> {
  return guildTranslatorFor(guild.id, guild.preferredLocale);
}

/**
 * A sanction DM is read by its recipient alone: it uses their own language when they picked one,
 * and falls back to the guild language when nothing else tells us what they read.
 */
async function memberTranslator(guild: Guild, userId: string): Promise<Translator> {
  const stored = readStoredLocale(await getUserLanguage(userId));
  return stored ? createTranslator(stored) : guildTranslator(guild);
}

/** Identity recorded in the history for automatically applied sanctions. */
export function botModerator(guild: Guild): ModeratorRef {
  return { id: guild.client.user.id, tag: guild.client.user.tag };
}

export function caseTypeLabel(type: ModerationCaseType, t: Translator): string {
  return t(`moderation.caseType.${type}`);
}

export function describeSanction(
  sanction: { type: SanctionType; timeoutMinutes: number },
  t: Translator,
): string {
  switch (sanction.type) {
    case "delete":
      return t("moderation.sanction.delete");
    case "warn":
      return t("moderation.sanction.warn");
    case "timeout":
      return t("moderation.sanction.timeout", {
        duration: formatDurationMs(sanction.timeoutMinutes * 60_000, t),
      });
    case "kick":
      return t("moderation.sanction.kick");
    case "ban":
      return t("moderation.sanction.ban");
  }
}

export function escalationLine(step: EscalationStep | null, t: Translator): string {
  if (!step) return "";
  const sanction = describeSanction({ type: step.action, timeoutMinutes: step.timeoutMinutes }, t);
  const warnings = t("moderation.escalation.warnCount", { count: step.warnCount });
  return `\n${t("moderation.escalation.line", { sanction, warnings })}`;
}

/** Reason attached to the Discord audit log entry when the moderator gave none. */
export async function auditReason(
  guild: Guild,
  reason: string | undefined,
  moderatorTag: string,
): Promise<string> {
  if (reason) return reason;
  const t = await guildTranslator(guild);
  return t("moderation.auditReason", { moderator: moderatorTag });
}

/** Lines describing a case, shared by the mod log and `/case`. */
export function caseLines(
  moderationCase: ModerationCase,
  t: Translator,
  withDate = false,
): string[] {
  const header = t("moderation.case.header", {
    case: moderationCase.caseNumber,
    type: caseTypeLabel(moderationCase.type, t),
  });

  const lines = [
    `### ${Emojis.Moderation} ${header}`,
    t("moderation.case.target", {
      tag: moderationCase.targetTag,
      id: moderationCase.targetId,
    }),
    t("moderation.case.moderator", { tag: moderationCase.moderatorTag }),
  ];

  if (withDate) {
    lines.push(
      t("moderation.case.date", {
        date: `<t:${Math.floor(moderationCase.createdAt.getTime() / 1000)}:F>`,
      }),
    );
  }

  if (moderationCase.reason) {
    lines.push(t("moderation.case.reason", { reason: moderationCase.reason }));
  }

  if (moderationCase.durationSecs) {
    lines.push(
      t("moderation.case.duration", {
        duration: formatDurationMs(moderationCase.durationSecs * 1000, t),
      }),
    );
  }

  return lines;
}

export function caseColor(type: ModerationCaseType): number {
  return TYPE_COLORS[type];
}

async function postModLog(guild: Guild, moderationCase: ModerationCase): Promise<void> {
  const guildConfig = await getOrCreateGuild(guild.id);
  if (!guildConfig.modLogChannelId) return;

  const channel = await guild.channels.fetch(guildConfig.modLogChannelId).catch(() => null);
  if (!channel || !channel.isTextBased() || !("send" in channel)) return;

  const t = await guildTranslator(guild);
  await channel.send(
    toV2Payload(
      false,
      buildContainer(caseColor(moderationCase.type), caseLines(moderationCase, t)),
    ),
  );
}

/** Creates a moderation case and posts it in the configured log channel, when there is one. */
export async function recordCase(input: RecordCaseInput): Promise<ModerationCase> {
  const moderationCase = await createModerationCase({
    guildId: input.guild.id,
    type: input.type,
    targetId: input.target.id,
    targetTag: input.target.tag,
    moderatorId: input.moderator.id,
    moderatorTag: input.moderator.tag,
    reason: input.reason,
    durationSecs: input.durationSecs,
  });

  await postModLog(input.guild, moderationCase);

  return moderationCase;
}

/** Warns the target in DM when the guild enabled it; stays silent when their DMs are closed. */
export async function notifyTarget(
  guild: Guild,
  user: User,
  type: ModerationCaseType,
  reason?: string,
): Promise<void> {
  const settings = await getModerationSettings(guild.id);
  if (!settings.dmOnSanction) return;

  const t = await memberTranslator(guild, user.id);
  const lines = [
    `### ${Emojis.Moderation} ${t("moderation.dm.header", { guild: guild.name })}`,
    t("moderation.dm.action", { action: caseTypeLabel(type, t) }),
  ];
  if (reason) lines.push(t("moderation.case.reason", { reason }));

  try {
    await user.send(toV2Payload(false, buildContainer(TYPE_COLORS[type], lines)));
  } catch {
    // Closed DMs: ignored, the action still stands on the server.
  }
}

/**
 * Applies a timeout, a kick or a ban (automod, warning escalation steps).
 * Returns false when the bot's role is too low to act on this member.
 */
export async function applyMemberSanction(
  member: GuildMember,
  sanction: MemberSanction,
  reason: string,
  moderator: ModeratorRef,
): Promise<boolean> {
  const { guild } = member;
  const botCheck = canBotModerate(await guild.members.fetchMe(), member);
  if (!botCheck.allowed) return false;

  const target = { id: member.id, tag: member.user.tag };

  if (sanction.type === "timeout") {
    await member.timeout(sanction.timeoutMinutes * 60_000, reason);
    await notifyTarget(guild, member.user, "TIMEOUT", reason);
    await recordCase({
      guild,
      type: "TIMEOUT",
      target,
      moderator,
      reason,
      durationSecs: sanction.timeoutMinutes * 60,
    });
    return true;
  }

  const type = sanction.type === "kick" ? "KICK" : "BAN";
  // The DM goes out before the kick or ban: after it, the bot no longer shares a guild with them.
  await notifyTarget(guild, member.user, type, reason);
  if (sanction.type === "kick") {
    await member.kick(reason);
  } else {
    await guild.bans.create(member.id, { reason });
  }
  await recordCase({ guild, type, target, moderator, reason });
  return true;
}

async function applyWarnEscalation(guild: Guild, target: User): Promise<EscalationStep | null> {
  const settings = await getModerationSettings(guild.id);
  if (settings.warnEscalation.length === 0) return null;

  const warnCount = await countActiveWarns(guild.id, target.id);
  const step = settings.warnEscalation.find((candidate) => candidate.warnCount === warnCount);
  if (!step) return null;

  const member = await guild.members.fetch(target.id).catch(() => null);
  if (!member) return null;

  try {
    const t = await guildTranslator(guild);
    const applied = await applyMemberSanction(
      member,
      { type: step.action, timeoutMinutes: step.timeoutMinutes },
      t("moderation.escalation.reason", {
        warnings: t("moderation.escalation.warnCount", { count: warnCount }),
      }),
      botModerator(guild),
    );
    return applied ? step : null;
  } catch (error) {
    logger.error({ err: error, guildId: guild.id }, "Automatic warning sanction failed");
    return null;
  }
}

/** Shared by `/warn`, the "Warn user" context menu and the automod. */
export async function performWarn(
  guild: Guild,
  target: User,
  moderator: ModeratorRef,
  reason?: string,
): Promise<WarnResult> {
  await createWarn(guild.id, target.id, moderator.id, reason);
  await notifyTarget(guild, target, "WARN", reason);

  const moderationCase = await recordCase({
    guild,
    type: "WARN",
    target: { id: target.id, tag: target.tag },
    moderator,
    reason,
  });

  const escalation = await applyWarnEscalation(guild, target);
  return { moderationCase, escalation };
}
