import { SlashCommandBuilder } from "discord.js";

import { Colors, Emojis } from "../../../client/Constants";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";
import { getPlayerOrThrow } from "../services/playerUtils";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder().setName("queue").setDescription("Affiche la file d'attente"),

  help: {
    details:
      "Affiche le morceau en cours et les 10 prochains titres avec leur position, à utiliser avec `/remove`.",
    examples: ["queue"],
  },

  async execute(interaction, client) {
    const player = getPlayerOrThrow(client, interaction.guildId!);
    const current = player.queue.current;
    const upcoming = player.queue.tracks.slice(0, 10);

    const lines = [`### ${Emojis.Music} File d'attente`];
    lines.push(
      current ? `**En cours :** ${current.info.title}` : "Rien n'est en cours de lecture.",
    );

    if (upcoming.length === 0) {
      lines.push("La file d'attente est vide.");
    } else {
      lines.push(
        upcoming.map((track, index) => `**${index + 1}.** ${track.info.title}`).join("\n"),
      );
      if (player.queue.tracks.length > upcoming.length) {
        lines.push(`… et ${player.queue.tracks.length - upcoming.length} autre(s) titre(s).`);
      }
    }

    await interaction.reply(toV2Payload(false, buildContainer(Colors.Music, lines)));
  },
};

export default command;
