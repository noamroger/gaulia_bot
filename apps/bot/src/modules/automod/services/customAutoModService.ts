import {
  getAutomodConfig,
  getOrCreateGuild,
  type AutomodRules,
  type AutomodSettings,
  type Sanction,
} from "@gaulia/database";
import { PermissionFlagsBits, type Guild, type GuildMember, type Message } from "discord.js";

import { Colors, Emojis, InviteRegex } from "../../../client/Constants";
import { logger } from "../../../client/logger";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import { guildTranslatorFor, type TranslationVars, type Translator } from "../../../i18n";
import {
  applyMemberSanction,
  botModerator,
  describeSanction,
  performWarn,
} from "../../moderation/services/moderationService";

const SETTINGS_TTL_MS = 30_000;
const TRACKER_IDLE_MS = 10 * 60_000;
const URL_REGEX = /\bhttps?:\/\/[^\s<>]+/gi;

interface CachedSettings {
  settings: AutomodSettings;
  badWordPatterns: RegExp[];
  expiresAt: number;
}

interface RecentMessage {
  content: string;
  count: number;
  lastAt: number;
}

interface Violation {
  /** Entry of `automod.violations` naming the rule that fired. */
  rule: string;
  /** Values interpolated into the detail line of that entry. */
  vars?: TranslationVars;
  action: Sanction;
}

/** Settings re-read at most every 30s per guild: the automod runs on every message. */
const settingsCache = new Map<string, CachedSettings>();
/** In memory only (never persisted), for the duplicate and flood rules. */
const lastMessageByUser = new Map<string, RecentMessage>();
const floodTimestampsByUser = new Map<string, number[]>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of lastMessageByUser) {
    if (now - entry.lastAt > TRACKER_IDLE_MS) lastMessageByUser.delete(key);
  }
  for (const [key, timestamps] of floodTimestampsByUser) {
    const last = timestamps.at(-1);
    if (last === undefined || now - last > TRACKER_IDLE_MS) floodTimestampsByUser.delete(key);
  }
}, TRACKER_IDLE_MS).unref();

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole word, case insensitive ("con" does not block "second"). */
function badWordPattern(word: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(word)}(?![\\p{L}\\p{N}])`, "iu");
}

async function loadSettings(guildId: string): Promise<CachedSettings> {
  const cached = settingsCache.get(guildId);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const settings = await getAutomodConfig(guildId);
  const entry: CachedSettings = {
    settings,
    badWordPatterns: settings.rules.badWords.words.map(badWordPattern),
    expiresAt: Date.now() + SETTINGS_TTL_MS,
  };
  settingsCache.set(guildId, entry);
  return entry;
}

function trackerKey(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

function checkInvites(content: string, rule: AutomodRules["invites"]): Violation | null {
  if (!rule.enabled) return null;
  const invites = content.match(InviteRegex);
  if (!invites) return null;

  const allowed = rule.allowedInvites.map((code) => code.toLowerCase());
  const forbidden = invites.some(
    (invite) => !allowed.some((code) => invite.toLowerCase().includes(code)),
  );
  return forbidden ? { rule: "invites", action: rule.action } : null;
}

function linkHostnames(content: string): string[] {
  return [...content.matchAll(URL_REGEX)].flatMap(([url]) => {
    try {
      return [new URL(url).hostname.toLowerCase().replace(/^www\./, "")];
    } catch {
      return [];
    }
  });
}

function matchesDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function checkLinks(content: string, rule: AutomodRules["links"]): Violation | null {
  if (!rule.enabled) return null;
  const hostnames = linkHostnames(content);
  if (hostnames.length === 0) return null;

  const listed = (hostname: string) =>
    rule.domains.some((domain) => matchesDomain(hostname, domain));
  const blocked =
    rule.mode === "blocklist"
      ? hostnames.some(listed)
      : hostnames.some((hostname) => !listed(hostname));

  return blocked
    ? {
        rule: rule.mode === "blocklist" ? "linkBlocked" : "linkNotAllowed",
        action: rule.action,
      }
    : null;
}

function checkBadWords(
  content: string,
  rule: AutomodRules["badWords"],
  patterns: RegExp[],
): Violation | null {
  if (!rule.enabled || !patterns.some((pattern) => pattern.test(content))) return null;
  return { rule: "badWords", action: rule.action };
}

function checkMentions(message: Message, rule: AutomodRules["mentions"]): Violation | null {
  if (!rule.enabled) return null;
  const mentionCount =
    message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
  if (mentionCount <= rule.maxMentions) return null;
  return { rule: "mentions", vars: { count: mentionCount }, action: rule.action };
}

function checkCaps(content: string, rule: AutomodRules["caps"]): Violation | null {
  if (!rule.enabled) return null;
  const letters = content.match(/\p{L}/gu) ?? [];
  if (letters.length < rule.minLength) return null;

  const uppercase = letters.filter((letter) => letter !== letter.toLowerCase()).length;
  if ((uppercase * 100) / letters.length < rule.percent) return null;
  return { rule: "caps", action: rule.action };
}

function checkDuplicates(
  key: string,
  content: string,
  rule: AutomodRules["duplicates"],
): Violation | null {
  if (!rule.enabled || content.length === 0) return null;

  const previous = lastMessageByUser.get(key);
  const count = previous && previous.content === content ? previous.count + 1 : 1;
  lastMessageByUser.set(key, { content, count, lastAt: Date.now() });

  if (count < rule.maxRepeats) return null;
  lastMessageByUser.delete(key);
  return { rule: "duplicates", vars: { count }, action: rule.action };
}

function checkFlood(key: string, rule: AutomodRules["flood"]): Violation | null {
  if (!rule.enabled) return null;

  const now = Date.now();
  const windowMs = rule.perSeconds * 1000;
  const timestamps = (floodTimestampsByUser.get(key) ?? []).filter((time) => now - time < windowMs);
  timestamps.push(now);
  floodTimestampsByUser.set(key, timestamps);

  if (timestamps.length < rule.maxMessages) return null;
  floodTimestampsByUser.delete(key);
  return {
    rule: "flood",
    vars: { count: timestamps.length, seconds: rule.perSeconds },
    action: rule.action,
  };
}

async function postAutomodLog(guild: Guild, title: string, description: string): Promise<void> {
  const config = await getOrCreateGuild(guild.id);
  if (!config.automodLogChannelId) return;

  const channel = await guild.channels.fetch(config.automodLogChannelId).catch(() => null);
  if (!channel || !channel.isTextBased() || !("send" in channel)) return;

  await channel.send(
    toV2Payload(
      false,
      buildContainer(Colors.Warning, [`### ${Emojis.Automod} ${title}`, description]),
    ),
  );
}

async function applyAutomodSanction(
  message: Message<true>,
  member: GuildMember | null,
  action: Sanction,
  reason: string,
  t: Translator,
): Promise<string> {
  if (action.type === "delete") return describeSanction(action, t);

  const moderator = botModerator(message.guild);

  if (action.type === "warn") {
    const { escalation } = await performWarn(message.guild, message.author, moderator, reason);
    if (!escalation) return describeSanction(action, t);
    const escalated = describeSanction(
      { type: escalation.action, timeoutMinutes: escalation.timeoutMinutes },
      t,
    );
    return t("automod.outcome.escalated", {
      sanction: escalated.toLowerCase(),
      warnings: t("moderation.escalation.warnCount", { count: escalation.warnCount }),
    });
  }

  if (!member) return t("automod.outcome.memberNotFound");

  const applied = await applyMemberSanction(
    member,
    { type: action.type, timeoutMinutes: action.timeoutMinutes },
    reason,
    moderator,
  );
  return applied ? describeSanction(action, t) : t("automod.outcome.botRoleTooLow");
}

/** Everything the automod posts or stores is read by the guild, so it follows the guild language. */
async function enforce(
  message: Message<true>,
  member: GuildMember | null,
  violation: Violation,
): Promise<void> {
  await message.delete().catch(() => undefined);

  const t = await guildTranslatorFor(message.guildId, message.guild.preferredLocale);
  const title = t(`automod.violations.${violation.rule}.title`);

  let outcome: string;
  try {
    outcome = await applyAutomodSanction(
      message,
      member,
      violation.action,
      t("automod.reason", { rule: title }),
      t,
    );
  } catch (error) {
    logger.error({ err: error, guildId: message.guildId }, "Automod sanction failed");
    outcome = t("automod.outcome.failed");
  }

  await postAutomodLog(
    message.guild,
    title,
    [
      t("automod.log.line", {
        target: message.author.tag,
        detail: t(`automod.violations.${violation.rule}.detail`, violation.vars),
        channel: message.channelId,
      }),
      t("automod.log.sanction", { outcome }),
    ].join("\n"),
  );
}

/**
 * Custom automod layer, on top of Discord's native AutoMod. Each rule is configurable per guild
 * (dashboard) with its own sanction. Called on every `messageCreate`.
 */
export async function runCustomAutoMod(message: Message): Promise<void> {
  if (!message.inGuild() || message.author.bot) return;

  const { settings, badWordPatterns } = await loadSettings(message.guildId);
  if (settings.ignoredChannelIds.includes(message.channelId)) return;

  const member = message.member;
  if (member) {
    if (settings.ignoredRoleIds.some((roleId) => member.roles.cache.has(roleId))) return;
    if (settings.exemptStaff && member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
  }

  const { rules } = settings;
  const { content } = message;
  const key = trackerKey(message.guildId, message.author.id);

  const violation =
    checkInvites(content, rules.invites) ??
    checkLinks(content, rules.links) ??
    checkBadWords(content, rules.badWords, badWordPatterns) ??
    checkMentions(message, rules.mentions) ??
    checkCaps(content, rules.caps) ??
    checkDuplicates(key, content, rules.duplicates) ??
    checkFlood(key, rules.flood);

  if (violation) {
    await enforce(message, member, violation);
  }
}
