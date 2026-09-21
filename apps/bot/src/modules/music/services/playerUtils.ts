import { getMusicSettings, type LoopMode } from "@gaulia/database";
import type { Guild, GuildMember, User } from "discord.js";
import type { Player } from "lavalink-client";

import type { GauliaClient } from "../../../client/GauliaClient";
import { GauliaError } from "../../../core/errors";
import { guildTranslatorFor, type Translator } from "../../../i18n";

const REPEAT_MODE_BY_LOOP: Record<LoopMode, "off" | "track" | "queue"> = {
  NONE: "off",
  TRACK: "track",
  QUEUE: "queue",
};

/** Messages posted to a channel are read by the whole server, so they follow its language. */
export function guildTranslator(client: GauliaClient, guildId: string): Promise<Translator> {
  return guildTranslatorFor(guildId, client.guilds.cache.get(guildId)?.preferredLocale);
}

export function requireVoiceChannelId(member: GuildMember): string {
  const channelId = member.voice.channelId;
  if (!channelId) {
    throw new GauliaError("music.error.notInVoice");
  }
  return channelId;
}

export function getPlayerOrThrow(client: GauliaClient, guildId: string): Player {
  const player = client.lavalink.getPlayer(guildId);
  if (!player) {
    throw new GauliaError("music.error.noPlayer");
  }
  return player;
}

/** Reuses the player of the server, or creates one with its default volume and repeat mode. */
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
    throw new GauliaError("music.error.differentVoice");
  }
}

export async function resolveMember(interaction: {
  guild: Guild | null;
  user: User;
}): Promise<GuildMember> {
  if (!interaction.guild) {
    throw new GauliaError("common.guard.guildOnly.description");
  }
  return (
    interaction.guild.members.cache.get(interaction.user.id) ??
    (await interaction.guild.members.fetch(interaction.user.id))
  );
}
