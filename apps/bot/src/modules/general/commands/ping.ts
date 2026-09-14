import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { successPayload, infoPayload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: false,
  data: new SlashCommandBuilder().setName("ping").setDescription("Affiche la latence du bot"),

  help: {
    details:
      "Mesure le temps de réponse de Gaulia : la latence API (aller-retour de la commande) et la latence WebSocket du shard qui gère ce serveur.",
    examples: ["ping"],
  },

  async execute(interaction, client) {
    const sent = await interaction.reply({
      ...infoPayload(true, `### ${Emojis.Loading} Calcul en cours…`),
      withResponse: true,
    });

    const roundTrip =
      (sent.resource?.message?.createdTimestamp ?? Date.now()) - interaction.createdTimestamp;
    const wsLatency = Math.round(client.ws.ping);

    await interaction.editReply(successPayload(false, "Pong !", `**Latence API :** ${roundTrip}ms\n**Latence WebSocket :** ${wsLatency}ms`));

  },
};

export default command;
