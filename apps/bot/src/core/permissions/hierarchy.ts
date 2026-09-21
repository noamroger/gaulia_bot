import { GuildMember } from "discord.js";

export interface HierarchyCheckResult {
  allowed: boolean;
  /** Translation key explaining the refusal, resolved by the caller in the reader's language. */
  reasonKey?: string;
}

/**
 * Checks that a moderator may act on a target (ban/kick/timeout/warn): no self moderation, nothing
 * against the server owner, and role hierarchy respected. The server owner bypasses the hierarchy.
 */
export function canModerate(moderator: GuildMember, target: GuildMember): HierarchyCheckResult {
  if (moderator.id === target.id) {
    return { allowed: false, reasonKey: "common.hierarchy.self" };
  }

  if (target.id === target.guild.ownerId) {
    return { allowed: false, reasonKey: "common.hierarchy.targetOwner" };
  }

  if (moderator.id === moderator.guild.ownerId) {
    return { allowed: true };
  }

  if (moderator.roles.highest.position <= target.roles.highest.position) {
    return { allowed: false, reasonKey: "common.hierarchy.targetHigher" };
  }

  return { allowed: true };
}

/** Checks that the bot's own role is high enough to act on the target. */
export function canBotModerate(botMember: GuildMember, target: GuildMember): HierarchyCheckResult {
  if (target.id === target.guild.ownerId) {
    return { allowed: false, reasonKey: "common.hierarchy.botTargetOwner" };
  }

  if (botMember.roles.highest.position <= target.roles.highest.position) {
    return { allowed: false, reasonKey: "common.hierarchy.botRoleTooLow" };
  }

  return { allowed: true };
}
