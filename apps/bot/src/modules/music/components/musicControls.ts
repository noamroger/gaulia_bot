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
import { requireSameVoiceChannel } from "../services/playerUtils";

type PlayerAction = (player: Player, interaction: ButtonInteraction) => Promise<void>;

/** Les vérifications ont lieu avant tout `deferUpdate` : une erreur après remplacerait la card. */
async function requireControlledPlayer(
  client: GauliaClient,
  interaction: ButtonInteraction,
): Promise<Player> {
  const guildId = interaction.customId.split(":")[2];
  if (!guildId || guildId !== interaction.guildId || !interaction.inCachedGuild()) {
    throw new GauliaError("Ce bouton ne correspond pas à ce serveur.");
  }

  const player = client.lavalink.getPlayer(guildId);
  if (!player) {
    throw new GauliaError("Il n'y a plus de lecture en cours.");
  }

  await assertMusicAccess(interaction.member, "control", null);
  requireSameVoiceChannel(interaction.member, player);
  return player;
}

async function updateCard(interaction: ButtonInteraction, player: Player): Promise<void> {
  const track = player.queue.current;
  if (track) {
    await interaction.update(buildNowPlayingPayload(player, track));
  } else {
    await interaction.deferUpdate();
  }
}

function playerButton(action: string, run: PlayerAction): ButtonComponent {
  return {
    type: "button",
    customIdPrefix: `music:${action}:`,
    async execute(interaction, client) {
      const player = await requireControlledPlayer(client, interaction);
      await run(player, interaction);
    },
  };
}

export default [
  playerButton("pause", async (player, interaction) => {
    if (player.paused) throw new GauliaError("La musique est déjà en pause.");
    await player.pause();
    await interaction.deferUpdate();
  }),
  playerButton("resume", async (player, interaction) => {
    if (!player.paused) throw new GauliaError("La musique n'est pas en pause.");
    await player.resume();
    await interaction.deferUpdate();
  }),
  playerButton("skip", async (player, interaction) => {
    if (player.queue.tracks.length === 0) {
      throw new GauliaError("Aucune musique suivante dans la file d'attente.");
    }
    await player.skip();
    await interaction.deferUpdate();
  }),
  playerButton("previous", async (player, interaction) => {
    const previous = player.queue.previous.at(0);
    if (!previous) throw new GauliaError("Aucune musique précédente.");
    await player.play({ track: previous });
    await interaction.deferUpdate();
  }),
  playerButton("stop", async (player, interaction) => {
    await interaction.deferUpdate();
    await player.destroy();
  }),
  playerButton("shuffle", async (player, interaction) => {
    await setShuffleEnabled(player, !isShuffleEnabled(player));
    await updateCard(interaction, player);
  }),
  playerButton("loop", async (player, interaction) => {
    await setLoopEnabled(player, !isLoopEnabled(player));
    await updateCard(interaction, player);
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
