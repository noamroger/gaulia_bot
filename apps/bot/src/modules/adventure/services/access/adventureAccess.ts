import { getAdventureSettings } from "@gaulia/database";
import type { ChatInputCommandInteraction, Interaction } from "discord.js";

import { GauliaError } from "../../../../core/errors";

const MAX_LISTED_CHANNELS = 5;

/**
 * Where the adventure may be played. DMs are always open; on a server everything depends on the
 * dashboard setting:
 *
 * - allowlist (the default, empty): playable only in the allowed channels, so nowhere until the
 *   server picks one;
 * - blocklist: playable everywhere except in the listed channels.
 *
 * Unlike the other modules, administrators do not bypass the rule: the whole point of the setting
 * is to keep the game in specific channels, whoever the member is.
 */
export async function assertAdventureAccess(
  interaction: ChatInputCommandInteraction | Interaction,
): Promise<void> {
  if (!interaction.inGuild()) return;

  const settings = await getAdventureSettings(interaction.guildId);
  if (!settings.enabled) {
    throw new GauliaError("adventure.error.moduleDisabled");
  }

  const channel = interaction.channel;
  const channelId =
    channel && "isThread" in channel && channel.isThread()
      ? (channel.parentId ?? interaction.channelId)
      : interaction.channelId;

  // `channelId` can be missing on some interactions: the channel then counts as unlisted, which
  // applies the server's default setting.
  const listed = channelId !== null && settings.channelIds.includes(channelId);

  if (settings.channelMode === "BLOCKLIST") {
    if (!listed) return;
    throw new GauliaError("adventure.error.channelBlocked");
  }

  if (listed) return;

  if (settings.channelIds.length === 0) {
    throw new GauliaError("adventure.error.noAdventureChannel");
  }

  const shown = settings.channelIds
    .slice(0, MAX_LISTED_CHANNELS)
    .map((id) => `<#${id}>`)
    .join(", ");
  const more = settings.channelIds.length > MAX_LISTED_CHANNELS ? "…" : "";
  throw new GauliaError("adventure.error.adventureChannels", { channels: `${shown}${more}` });
}
