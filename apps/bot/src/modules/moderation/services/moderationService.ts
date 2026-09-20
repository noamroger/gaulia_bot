import {
  countActiveWarns,
  createModerationCase,
  createWarn,
  getModerationSettings,
  getOrCreateGuild,
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

const TYPE_LABELS: Record<ModerationCaseType, string> = {
  BAN: "Bannissement",
  UNBAN: "Débannissement",
  KICK: "Expulsion",
  TIMEOUT: "Mise en sourdine temporaire",
  UNTIMEOUT: "Fin de mise en sourdine",
  WARN: "Avertissement",
  UNWARN: "Révocation d'avertissement",
  PURGE: "Purge de messages",
};

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
  /** Palier de sanction automatique déclenché par cet avertissement, s'il y en a un. */
  escalation: EscalationStep | null;
}

/** Identité utilisée dans l'historique pour les sanctions appliquées automatiquement. */
export function botModerator(guild: Guild): ModeratorRef {
  return { id: guild.client.user.id, tag: guild.client.user.tag };
}

export function describeSanction(sanction: { type: SanctionType; timeoutMinutes: number }): string {
  switch (sanction.type) {
    case "delete":
      return "Suppression du message";
    case "warn":
      return "Avertissement";
    case "timeout":
      return `Sourdine de ${formatDurationMs(sanction.timeoutMinutes * 60_000)}`;
    case "kick":
      return "Expulsion";
    case "ban":
      return "Bannissement";
  }
}

export function escalationLine(step: EscalationStep | null): string {
  if (!step) return "";
  const sanction = describeSanction({ type: step.action, timeoutMinutes: step.timeoutMinutes });
  return `\n**Sanction automatique :** ${sanction} (${step.warnCount} avertissements)`;
}

async function postModLog(guild: Guild, moderationCase: ModerationCase): Promise<void> {
  const guildConfig = await getOrCreateGuild(guild.id);
  if (!guildConfig.modLogChannelId) return;

  const channel = await guild.channels.fetch(guildConfig.modLogChannelId).catch(() => null);
  if (!channel || !channel.isTextBased() || !("send" in channel)) return;

  const lines = [
    `### ${Emojis.Moderation} Cas #${moderationCase.caseNumber} - ${TYPE_LABELS[moderationCase.type]}`,
    `**Cible :** ${moderationCase.targetTag} (\`${moderationCase.targetId}\`)`,
    `**Modérateur :** ${moderationCase.moderatorTag}`,
  ];

  if (moderationCase.reason) lines.push(`**Raison :** ${moderationCase.reason}`);
  if (moderationCase.durationSecs) {
    lines.push(`**Durée :** ${formatDurationMs(moderationCase.durationSecs * 1000)}`);
  }

  await channel.send(toV2Payload(false, buildContainer(TYPE_COLORS[moderationCase.type], lines)));
}

/** Crée un cas de modération en base et le poste dans le salon de logs configuré, s'il y en a un. */
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

/** Prévient la cible en DM si le serveur l'a activé ; échoue silencieusement si ses DMs sont fermés. */
export async function notifyTarget(
  guild: Guild,
  user: User,
  type: ModerationCaseType,
  reason?: string,
): Promise<void> {
  const settings = await getModerationSettings(guild.id);
  if (!settings.dmOnSanction) return;

  const lines = [
    `### ${Emojis.Moderation} Action de modération - ${guild.name}`,
    `**Action :** ${TYPE_LABELS[type]}`,
  ];
  if (reason) lines.push(`**Raison :** ${reason}`);

  try {
    await user.send(toV2Payload(false, buildContainer(TYPE_COLORS[type], lines)));
  } catch {
    // DMs fermés : on ignore silencieusement, l'action reste effective côté serveur.
  }
}

export function caseTypeLabel(type: ModerationCaseType): string {
  return TYPE_LABELS[type];
}

/**
 * Applique une sourdine, une expulsion ou un bannissement (automod, paliers d'avertissements).
 * Retourne false si le rôle du bot est trop bas pour agir sur ce membre.
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
  // Le DM part avant l'expulsion/le bannissement : après, le bot ne partage plus de serveur avec la cible.
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
    const applied = await applyMemberSanction(
      member,
      { type: step.action, timeoutMinutes: step.timeoutMinutes },
      `Sanction automatique : ${warnCount} avertissements`,
      botModerator(guild),
    );
    return applied ? step : null;
  } catch (error) {
    logger.error(
      { err: error, guildId: guild.id },
      "Échec d'une sanction automatique d'avertissements",
    );
    return null;
  }
}

/** Logique partagée entre `/warn`, le context-menu "Avertir l'utilisateur" et l'automod. */
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
