import { SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import type { ChatInputCommand } from "../../../structures/Command";
import {
  buildCommandHelp,
  buildHelpOverview,
  findCommand,
  helpAutocompleteChoices,
} from "../services/helpService";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: false,
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche les commandes de Gaulia ou l'aide détaillée d'une commande")
    .addStringOption((option) =>
      option
        .setName("commande")
        .setDescription("Commande dont afficher l'aide détaillée")
        .setMaxLength(100)
        .setAutocomplete(true),
    ),

  help: {
    details:
      "Sans option, liste toutes les commandes par catégorie. Avec le nom d'une commande, affiche son aide détaillée : utilisation, options, conditions d'accès et exemples. Le nom se complète automatiquement pendant la saisie.",
    examples: ["help", "help commande:ban"],
  },

  async autocomplete(interaction, client) {
    await interaction.respond(
      helpAutocompleteChoices(client.commands, interaction.options.getFocused()),
    );
  },

  async execute(interaction, client) {
    const query = interaction.options.getString("commande");

    if (!query) {
      await interaction.reply(buildHelpOverview(client.commands));
      return;
    }

    const target = findCommand(client.commands, query);
    if (!target) {
      throw new GauliaError(
        `Aucune commande ne s'appelle « ${query} ». Utilise \`/help\` pour voir la liste.`,
      );
    }

    await interaction.reply(buildCommandHelp(target));
  },
};

export default command;
