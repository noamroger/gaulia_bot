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
import type { Translator } from "../../../i18n";
import { buildTrackContainer } from "./musicUi";
import { isLoopEnabled, isShuffleEnabled } from "./playbackControls";
import { guildTranslator } from "./playerUtils";

interface TrackedMessage {
  channelId: string;
  messageId: string;
}

/** Current "now playing" message per guild, in memory, per shard process. */
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

function buildControlRows(
  player: Player,
  t: Translator,
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const id = (action: string) => `music:${action}:${player.guildId}`;
  const modeStyle = (enabled: boolean) => (enabled ? ButtonStyle.Success : ButtonStyle.Danger);

  return [
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      controlButton(id("pause"), Emojis.Pause, ButtonStyle.Secondary, t("music.controls.pause")),
      controlButton(id("resume"), Emojis.Resume, ButtonStyle.Secondary, t("music.controls.resume")),
      controlButton(id("skip"), Emojis.Skip, ButtonStyle.Secondary, t("music.controls.skip")),
      controlButton(
        id("previous"),
        Emojis.Back,
        ButtonStyle.Secondary,
        t("music.controls.previous"),
      ),
      controlButton(id("stop"), Emojis.Stop, ButtonStyle.Primary, t("music.controls.stop")),
    ),
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      controlButton(id("shuffle"), Emojis.Shuffle, modeStyle(isShuffleEnabled(player))),
      controlButton(id("loop"), Emojis.Loop, modeStyle(isLoopEnabled(player))),
      controlButton(id("volume-down"), Emojis.VolumeDown, ButtonStyle.Secondary),
      controlButton(id("volume-up"), Emojis.VolumeUp, ButtonStyle.Secondary),
    ),
  ];
}

export function buildNowPlayingPayload(
  player: Player,
  track: Track,
  t: Translator,
): V2MessagePayload {
  return toV2Payload(
    false,
    buildTrackContainer(t, t("music.ui.nowPlayingTitle"), track),
    ...buildControlRows(player, t),
  );
}

/** Posts the "now playing" card, or edits the one already shown for this guild. */
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

  const t = await guildTranslator(client, player.guildId);
  const payload = buildNowPlayingPayload(player, track, t);

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

/** Renders the card again with the current player state (shuffle or repeat mode changed). */
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
