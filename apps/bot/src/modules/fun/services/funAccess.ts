import { getOrCreateGuild } from "@gaulia/database";
import { PermissionFlagsBits, type GuildMember, type GuildTextBasedChannel } from "discord.js";

import { GauliaError } from "../../../core/errors";

const MAX_LISTED_CHANNELS = 5;

/**
 * Applique la liste des salons fun choisie sur le dashboard (vide = partout). Un fil suit son salon
 * parent ; seuls les administrateurs du serveur ne sont jamais bloqués.
 */
export async function assertFunChannel(
  member: GuildMember,
  channel: GuildTextBasedChannel | null,
  channelId: string,
): Promise<void> {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return;

  const { funChannelIds } = await getOrCreateGuild(member.guild.id);
  if (funChannelIds.length === 0) return;

  const effectiveChannelId = channel?.isThread() ? (channel.parentId ?? channelId) : channelId;
  if (funChannelIds.includes(effectiveChannelId)) return;

  const listed = funChannelIds
    .slice(0, MAX_LISTED_CHANNELS)
    .map((id) => `<#${id}>`)
    .join(", ");
  const more = funChannelIds.length > MAX_LISTED_CHANNELS ? "…" : "";

  throw new GauliaError(`Les commandes fun sont réservées aux salons suivants : ${listed}${more}`);
}
