import { SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { toV2Payload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";
import { buildTrackContainer, formatTrackTime } from "../services/musicUi";
import { getPlayerOrThrow } from "../services/playerUtils";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Affiche le morceau en cours"),

  help: {
    details:
      "Affiche la musique en cours : titre, source, durée, membre qui l'a ajoutée, pochette et position de lecture.",
    examples: ["nowplaying"],
  },

  async execute(interaction, client) {
    const player = getPlayerOrThrow(client, interaction.guildId!);
    const track = player.queue.current;

    if (!track) {
      throw new GauliaError("Rien n'est en cours de lecture.");
    }

    const position = `Position : \`${formatTrackTime(player.position)}\`${player.paused ? " (en pause)" : ""}`;

    await interaction.reply(
      toV2Payload(false, buildTrackContainer("Musique en cours", track, [position])),
    );
  },
};

export default command;
