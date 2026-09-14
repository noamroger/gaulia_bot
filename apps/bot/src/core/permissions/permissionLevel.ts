import { GuildMember, PermissionFlagsBits } from "discord.js";

import { env } from "../../config/env";

export enum PermissionLevel {
  Everyone = 0,
  Moderator = 1,
  Administrator = 2,
  Owner = 3,
}

const MODERATOR_PERMISSIONS = [
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.ManageMessages,
];

/**
 * Détermine le niveau de permission le plus élevé d'un membre.
 * L'ordre est important : on retourne dès que le niveau le plus haut applicable est trouvé.
 */
export function resolvePermissionLevel(member: GuildMember): PermissionLevel {
  if (env.OWNER_IDS.includes(member.id)) {
    return PermissionLevel.Owner;
  }

  if (
    member.guild.ownerId === member.id ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return PermissionLevel.Administrator;
  }

  if (MODERATOR_PERMISSIONS.some((permission) => member.permissions.has(permission))) {
    return PermissionLevel.Moderator;
  }

  return PermissionLevel.Everyone;
}

export function hasPermissionLevel(member: GuildMember, required: PermissionLevel): boolean {
  return resolvePermissionLevel(member) >= required;
}

export function permissionLevelLabel(level: PermissionLevel): string {
  switch (level) {
    case PermissionLevel.Owner:
      return "Propriétaire du bot";
    case PermissionLevel.Administrator:
      return "Administrateur";
    case PermissionLevel.Moderator:
      return "Modérateur";
    default:
      return "Tout le monde";
  }
}
