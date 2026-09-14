import { SlashCommandBuilder } from "discord.js";

import { Emojis, FREE_QUEUE_LIMIT, PREMIUM_QUEUE_LIMIT } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import type { ChatInputCommand } from "../../../structures/Command";
import { isPremiumGuild } from "../../premium/services/entitlementService";
import { interventionOf, musicActionPayload, trackLink } from "../services/musicUi";
import { isShuffleEnabled } from "../services/playbackControls";
import {
  getOrCreateConfiguredPlayer,
  requireVoiceChannelId,
  resolveMember,
} from "../services/playerUtils";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  cooldownSeconds: 2,
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Joue une musique ou l'ajoute à la file d'attente")
    .addStringOption((option) =>
      option.setName("recherche").setDescription("Titre, artiste ou lien").setRequired(true),
    ),

  help: {
    details: `Recherche un titre sur SoundCloud à partir d'un nom ou d'un artiste, ou charge directement un lien (titre ou playlist), puis l'ajoute à la file d'attente. Gaulia rejoint ton salon vocal et lance la lecture si rien n'est en cours. La file est limitée à ${FREE_QUEUE_LIMIT} titres, ${PREMIUM_QUEUE_LIMIT} avec Premium.`,
    examples: [
      "play recherche:Daft Punk One More Time",
      "play recherche:https://soundcloud.com/artiste/titre",
    ],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const voiceChannelId = requireVoiceChannelId(member);
    const query = interaction.options.getString("recherche", true);
    const guildId = interaction.guildId!;

    await interaction.deferReply();

    const player = await getOrCreateConfiguredPlayer(client, {
      guildId,
      voiceChannelId,
      textChannelId: interaction.channelId,
    });

    if (!player.connected) {
      await player.connect();
    }

    // YouTube bloque la lecture depuis le serveur (403 / "confirm you're not a bot") sans compte.
    const result = await player.search({ query, source: "scsearch" }, interaction.user);

    if (!result.tracks.length) {
      throw new GauliaError("Aucun résultat trouvé pour cette recherche.");
    }

    const limit = isPremiumGuild(guildId) ? PREMIUM_QUEUE_LIMIT : FREE_QUEUE_LIMIT;
    if (player.queue.tracks.length >= limit) {
      throw new GauliaError(
        `La file d'attente est limitée à ${limit} titres sur ce serveur. Passe en Gaulia Premium pour l'étendre.`,
      );
    }

    const intervention = interventionOf(interaction.user);

    if (result.loadType === "playlist") {
      await player.queue.add(result.tracks);
      await interaction.editReply(
        musicActionPayload(
          interaction.user,
          Emojis.Music,
          "Playlist ajoutée",
          `\`${result.tracks.length}\` musique(s) de **${result.playlist?.name ?? "la playlist"}** ont été ajoutées à la file ${intervention}.`,
        ),
      );
    } else {
      const track = result.tracks[0]!;
      await player.queue.add(track);
      await interaction.editReply(
        musicActionPayload(
          interaction.user,
          Emojis.Music,
          "Musique ajoutée",
          `${trackLink(track)} a été ajoutée à la file ${intervention}.`,
        ),
      );
    }

    if (isShuffleEnabled(player)) {
      await player.queue.shuffle();
    }

    if (!player.playing && !player.paused) {
      await player.play();
    }
  },
};

export default command;
