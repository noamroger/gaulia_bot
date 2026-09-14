import { GuildMember } from "discord.js";

export interface HierarchyCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Vérifie qu'un modérateur peut agir sur un membre cible (ban/kick/timeout/warn) :
 * pas d'auto-modération, pas d'action sur le propriétaire du serveur, et hiérarchie de rôles respectée
 * (sauf pour le propriétaire du serveur, qui passe outre la hiérarchie).
 */
export function canModerate(moderator: GuildMember, target: GuildMember): HierarchyCheckResult {
  if (moderator.id === target.id) {
    return { allowed: false, reason: "Tu ne peux pas effectuer cette action sur toi-même." };
  }

  if (target.id === target.guild.ownerId) {
    return { allowed: false, reason: "Impossible d'agir sur le propriétaire du serveur." };
  }

  if (moderator.id === moderator.guild.ownerId) {
    return { allowed: true };
  }

  if (moderator.roles.highest.position <= target.roles.highest.position) {
    return {
      allowed: false,
      reason: "Ce membre a un rôle égal ou supérieur au tien.",
    };
  }

  return { allowed: true };
}

/**
 * Vérifie que le bot a un rôle assez élevé pour agir sur la cible.
 */
export function canBotModerate(botMember: GuildMember, target: GuildMember): HierarchyCheckResult {
  if (target.id === target.guild.ownerId) {
    return { allowed: false, reason: "Je ne peux pas agir sur le propriétaire du serveur." };
  }

  if (botMember.roles.highest.position <= target.roles.highest.position) {
    return {
      allowed: false,
      reason: "Mon rôle est trop bas dans la hiérarchie pour agir sur ce membre.",
    };
  }

  return { allowed: true };
}
