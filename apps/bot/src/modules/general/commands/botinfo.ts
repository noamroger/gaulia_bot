import { SlashCommandBuilder } from "discord.js";

import type { ChatInputCommand } from "../../../structures/Command";
import { collectBotInfo } from "../services/botinfo/botStatsService";
import { botInfoView, isBotInfoView } from "../services/botinfo/botinfoUi";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: false,
  cooldownSeconds: 10,
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Affiche les informations et les statistiques de Gaulia")
    .addStringOption((option) =>
      option
        .setName("vue")
        .setDescription("Onglet à ouvrir directement")
        .addChoices(
          { name: "Aperçu", value: "apercu" },
          { name: "Technique", value: "technique" },
          { name: "Shards", value: "shards" },
          { name: "Commandes", value: "commandes" },
          { name: "Modules", value: "modules" },
        ),
    ),

  help: {
    details:
      "Tout ce qu'il y a à savoir sur Gaulia, en cinq onglets navigables aux boutons : l'aperçu (identité, serveurs, membres, état), la fiche technique (versions, mémoire, base de données, Lavalink), le détail des shards, les statistiques d'utilisation des commandes sur 30 jours et l'activité de chaque module. Les totaux proviennent des heartbeats envoyés par tous les shards, pas seulement de celui qui te répond.",
    examples: ["botinfo", "botinfo vue:shards"],
  },

  async execute(interaction, client) {
    await interaction.deferReply();

    const requested = interaction.options.getString("vue") ?? "apercu";
    const view = isBotInfoView(requested) ? requested : "apercu";
    const snapshot = await collectBotInfo(client);

    await interaction.editReply(botInfoView(snapshot, view, interaction.user.id));
  },
};

export default command;
