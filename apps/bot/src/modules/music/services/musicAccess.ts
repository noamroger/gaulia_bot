import { getOrCreateGuild } from "@gaulia/database";
import { PermissionFlagsBits, type GuildMember } from "discord.js";

import { GauliaError } from "../../../core/errors";

/** "listen" : écouter et ajouter des titres ; "control" : agir sur la lecture (rôle DJ si configuré). */
export type MusicAccess = "listen" | "control";

/** Niveau d'accès requis par commande musique, indexé par nom de commande Discord. */
export const MUSIC_COMMAND_ACCESS: Readonly<Partial<Record<string, MusicAccess>>> = {
  play: "listen",
  queue: "listen",
  nowplaying: "listen",
  summon: "listen",
  skip: "control",
  pause: "control",
  resume: "control",
  stop: "control",
  volume: "control",
  shuffle: "control",
  seek: "control",
  previous: "control",
  loop: "control",
  filters: "control",
  remove: "control",
  "247": "control",
};

/**
 * Applique le salon musique et le rôle DJ configurés sur le dashboard. Seuls les administrateurs
 * échappent au salon ; « Gérer le serveur » suffit pour le rôle DJ. `channelId` null : pas de
 * contrôle de salon (ex : boutons de la carte).
 */
export async function assertMusicAccess(
  member: GuildMember,
  access: MusicAccess,
  channelId: string | null,
): Promise<void> {
  const checkChannel =
    channelId !== null && !member.permissions.has(PermissionFlagsBits.Administrator);
  const checkDjRole =
    access === "control" && !member.permissions.has(PermissionFlagsBits.ManageGuild);
  if (!checkChannel && !checkDjRole) return;

  const guildConfig = await getOrCreateGuild(member.guild.id);

  if (checkChannel && guildConfig.musicChannelId && channelId !== guildConfig.musicChannelId) {
    throw new GauliaError(
      `Les commandes musique sont réservées au salon <#${guildConfig.musicChannelId}>.`,
    );
  }

  if (checkDjRole && guildConfig.djRoleId && !member.roles.cache.has(guildConfig.djRoleId)) {
    throw new GauliaError(`Cette action est réservée au rôle <@&${guildConfig.djRoleId}>.`);
  }
}
