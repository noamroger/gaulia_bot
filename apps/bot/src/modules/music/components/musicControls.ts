import type { ButtonInteraction } from "discord.js";
import type { Player } from "lavalink-client";

import type { GauliaClient } from "../../../client/GauliaClient";
import { GauliaError } from "../../../core/errors";
import type { ButtonComponent } from "../../../structures/Component";
import { assertMusicAccess } from "../services/musicAccess";
import { buildNowPlayingPayload } from "../services/nowPlayingCardService";
import {
  VOLUME_STEP,
  isLoopEnabled,
  isShuffleEnabled,
  setClampedVolume,
  setLoopEnabled,
  setShuffleEnabled,
} from "../services/playbackControls";
import { guildTranslator, requireSameVoiceChannel } from "../services/playerUtils";

type PlayerAction = (
  player: Player,
  interaction: ButtonInteraction,
  client: GauliaClient,
) => Promise<void>;

/** Every check runs before any `deferUpdate`: an error afterwards would replace the card. */
async function requireControlledPlayer(
  client: GauliaClient,
  interaction: ButtonInteraction,
): Promise<Player> {
  const guildId = interaction.customId.split(":")[2];
  if (!guildId || guildId !== interaction.guildId || !interaction.inCachedGuild()) {
    throw new GauliaError("music.error.staleButton");
  }

  const player = client.lavalink.getPlayer(guildId);
  if (!player) {
    throw new GauliaError("music.error.playerGone");
  }

  await assertMusicAccess(interaction.member, "control", null);
  requireSameVoiceChannel(interaction.member, player);
  return player;
}

/** The card is read by the whole channel, so it is rendered in the language of the server. */
async function updateCard(
  client: GauliaClient,
  interaction: ButtonInteraction,
  player: Player,
): Promise<void> {
  const track = player.queue.current;
  if (!track) {
    await interaction.deferUpdate();
    return;
  }
  const t = await guildTranslator(client, player.guildId);
  await interaction.update(buildNowPlayingPayload(player, track, t));
}

function playerButton(action: string, run: PlayerAction): ButtonComponent {
  return {
    type: "button",
    customIdPrefix: `music:${action}:`,
    async execute(interaction, client) {
      const player = await requireControlledPlayer(client, interaction);
      await run(player, interaction, client);
    },
  };
}

export default [
  playerButton("pause", async (player, interaction) => {
    if (player.paused) throw new GauliaError("music.error.alreadyPaused");
    await player.pause();
    await interaction.deferUpdate();
  }),
  playerButton("resume", async (player, interaction) => {
    if (!player.paused) throw new GauliaError("music.error.notPaused");
    await player.resume();
    await interaction.deferUpdate();
  }),
  playerButton("skip", async (player, interaction) => {
    if (player.queue.tracks.length === 0) {
      throw new GauliaError("music.error.noNextTrack");
    }
    await player.skip();
    await interaction.deferUpdate();
  }),
  playerButton("previous", async (player, interaction) => {
    const previous = player.queue.previous.at(0);
    if (!previous) throw new GauliaError("music.error.noPreviousTrack");
    await player.play({ track: previous });
    await interaction.deferUpdate();
  }),
  playerButton("stop", async (player, interaction) => {
    await interaction.deferUpdate();
    await player.destroy();
  }),
  playerButton("shuffle", async (player, interaction, client) => {
    await setShuffleEnabled(player, !isShuffleEnabled(player));
    await updateCard(client, interaction, player);
  }),
  playerButton("loop", async (player, interaction, client) => {
    await setLoopEnabled(player, !isLoopEnabled(player));
    await updateCard(client, interaction, player);
  }),
  playerButton("volume-down", async (player, interaction) => {
    await setClampedVolume(player, player.volume - VOLUME_STEP);
    await interaction.deferUpdate();
  }),
  playerButton("volume-up", async (player, interaction) => {
    await setClampedVolume(player, player.volume + VOLUME_STEP);
    await interaction.deferUpdate();
  }),
];
