import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import type { Player, Track } from "lavalink-client";

import { Emojis } from "../../../client/Constants";
import type { GauliaClient } from "../../../client/GauliaClient";
import { toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import { buildTrackContainer } from "./musicUi";
import { isLoopEnabled, isShuffleEnabled } from "./playbackControls";

interface TrackedMessage {
  channelId: string;
  messageId: string;
}

/** Référence du message "now playing" en cours, par guilde (en mémoire, par process de shard). */
const nowPlayingMessages = new Map<string, TrackedMessage>();

function controlButton(
  customId: string,
  emoji: string,
  style: ButtonStyle,
  label?: string,
): ButtonBuilder {
  const button = new ButtonBuilder().setCustomId(customId).setEmoji(emoji).setStyle(style);
  return label ? button.setLabel(label) : button;
}

function buildControlRows(player: Player): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const id = (action: string) => `music:${action}:${player.guildId}`;
  const modeStyle = (enabled: boolean) => (enabled ? ButtonStyle.Success : ButtonStyle.Danger);

  return [
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      controlButton(id("pause"), Emojis.Pause, ButtonStyle.Secondary, "Pause"),
      controlButton(id("resume"), Emojis.Resume, ButtonStyle.Secondary, "Resume"),
      controlButton(id("skip"), Emojis.Skip, ButtonStyle.Secondary, "Skip"),
      controlButton(id("previous"), Emojis.Back, ButtonStyle.Secondary, "Back"),
      controlButton(id("stop"), Emojis.Stop, ButtonStyle.Primary, "Stop"),
    ),
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      controlButton(id("shuffle"), Emojis.Shuffle, modeStyle(isShuffleEnabled(player))),
      controlButton(id("loop"), Emojis.Loop, modeStyle(isLoopEnabled(player))),
      controlButton(id("volume-down"), Emojis.VolumeDown, ButtonStyle.Secondary),
      controlButton(id("volume-up"), Emojis.VolumeUp, ButtonStyle.Secondary),
    ),
  ];
}

export function buildNowPlayingPayload(player: Player, track: Track): V2MessagePayload {
  return toV2Payload(
    false,
    buildTrackContainer("Musique en cours", track),
    ...buildControlRows(player),
  );
}

/** Poste la card "now playing", ou édite celle déjà affichée pour cette guilde si elle existe. */
export async function postOrUpdateNowPlayingCard(
  client: GauliaClient,
  player: Player,
  track?: Track,
): Promise<void> {
  if (!track) return;

  const channelId = player.textChannelId;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased() || !("send" in channel)) return;

  const payload = buildNowPlayingPayload(player, track);

  const existing = nowPlayingMessages.get(player.guildId);
  if (existing) {
    const message = await channel.messages.fetch(existing.messageId).catch(() => null);
    if (message) {
      await message.edit(payload);
      return;
    }
  }

  const sent = await channel.send(payload);
  nowPlayingMessages.set(player.guildId, { channelId, messageId: sent.id });
}

/** Re-rend la card avec l'état courant du player (ex : mode aléatoire ou répétition modifiés). */
export async function refreshNowPlayingCard(client: GauliaClient, player: Player): Promise<void> {
  const current = player.queue.current ?? undefined;
  await postOrUpdateNowPlayingCard(client, player, current);
}

export async function deleteNowPlayingCard(client: GauliaClient, guildId: string): Promise<void> {
  const existing = nowPlayingMessages.get(guildId);
  if (!existing) return;
  nowPlayingMessages.delete(guildId);

  const channel = await client.channels.fetch(existing.channelId).catch(() => null);
  if (!channel || !channel.isTextBased() || !("messages" in channel)) return;

  const message = await channel.messages.fetch(existing.messageId).catch(() => null);
  await message?.delete().catch(() => undefined);
}
