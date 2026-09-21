import { GuildMember, PermissionFlagsBits } from "discord.js";

import { env } from "../../config/env";
import type { Translator } from "../../i18n";

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

/** Highest permission level of a member; the order matters, the first match wins. */
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

export function permissionLevelLabel(level: PermissionLevel, t: Translator): string {
  switch (level) {
    case PermissionLevel.Owner:
      return t("common.permissionLevel.owner");
    case PermissionLevel.Administrator:
      return t("common.permissionLevel.administrator");
    case PermissionLevel.Moderator:
      return t("common.permissionLevel.moderator");
    default:
      return t("common.permissionLevel.everyone");
  }
}
