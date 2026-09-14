import { getMusicSettings, type LoopMode } from "@gaulia/database";
import type { Guild, GuildMember, User } from "discord.js";
import type { Player } from "lavalink-client";

import type { GauliaClient } from "../../../client/GauliaClient";
import { GauliaError } from "../../../core/errors";

const REPEAT_MODE_BY_LOOP: Record<LoopMode, "off" | "track" | "queue"> = {
  NONE: "off",
  TRACK: "track",
  QUEUE: "queue",
};

export function requireVoiceChannelId(member: GuildMember): string {
  const channelId = member.voice.channelId;
  if (!channelId) {
    throw new GauliaError("Tu dois être dans un salon vocal pour utiliser cette commande.");
  }
  return channelId;
}

export function getPlayerOrThrow(client: GauliaClient, guildId: string): Player {
  const player = client.lavalink.getPlayer(guildId);
  if (!player) {
    throw new GauliaError("Il n'y a pas de lecture en cours sur ce serveur.");
  }
  return player;
}

/** Réutilise le player du serveur, ou en crée un avec le volume et la répétition par défaut du serveur. */
export async function getOrCreateConfiguredPlayer(
  client: GauliaClient,
  options: { guildId: string; voiceChannelId: string; textChannelId: string },
): Promise<Player> {
  const existing = client.lavalink.getPlayer(options.guildId);
  if (existing) return existing;

  const settings = await getMusicSettings(options.guildId);
  const player = client.lavalink.createPlayer({
    ...options,
    selfDeaf: true,
    volume: settings.volume,
  });
  await player.setRepeatMode(REPEAT_MODE_BY_LOOP[settings.defaultLoop]);
  return player;
}

export function requireSameVoiceChannel(member: GuildMember, player: Player): void {
  if (member.voice.channelId !== player.voiceChannelId) {
    throw new GauliaError("Tu dois être dans le même salon vocal que moi pour faire ça.");
  }
}

export async function resolveMember(interaction: {
  guild: Guild | null;
  user: User;
}): Promise<GuildMember> {
  if (!interaction.guild) {
    throw new GauliaError("Cette commande n'est utilisable qu'en serveur.");
  }
  return (
    interaction.guild.members.cache.get(interaction.user.id) ??
    (await interaction.guild.members.fetch(interaction.user.id))
  );
}
