import { getOrCreateGuild } from "@gaulia/database";
import { PermissionFlagsBits, type GuildMember } from "discord.js";

import { GauliaError } from "../../../core/errors";

/** "listen": listen and queue tracks; "control": act on playback (DJ role when one is set). */
export type MusicAccess = "listen" | "control";

/** Access level each music command needs, keyed by Discord command name. */
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
 * Applies the music channel and the DJ role set on the dashboard. Only administrators escape the
 * channel; Manage Server is enough for the DJ role. A null `channelId` skips the channel check
 * (the player card buttons, for instance).
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
    throw new GauliaError("music.access.channelOnly", { channel: guildConfig.musicChannelId });
  }

  if (checkDjRole && guildConfig.djRoleId && !member.roles.cache.has(guildConfig.djRoleId)) {
    throw new GauliaError("music.access.djRoleOnly", { role: guildConfig.djRoleId });
  }
}
