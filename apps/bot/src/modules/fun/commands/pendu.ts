import { SlashCommandBuilder } from "discord.js";

import type { ChatInputCommand } from "../../../structures/Command";
import { hangmanGames, startHangman } from "../services/hangman";

const command: ChatInputCommand = {
  type: "chatInput",
  cooldownSeconds: 3,
  data: new SlashCommandBuilder()
    .setName("pendu")
    .setDescription("Lance une partie de pendu avec un mot français")
    .addBooleanOption((option) =>
      option
        .setName("ouvert")
        .setDescription("Tous les membres du salon peuvent proposer des lettres (non par défaut)"),
    ),

  help: {
    details:
      "Devine le mot lettre par lettre avec les menus, ou propose directement le mot entier. Au bout de 6 erreurs, la partie est perdue ; un mot faux compte comme une erreur. Les accents sont ignorés. Avec `ouvert`, tous les membres du salon jouent ensemble.",
    examples: ["pendu", "pendu ouvert:True"],
  },

  async execute(interaction) {
    const { gameId, payload } = startHangman(
      interaction.user.id,
      interaction.options.getBoolean("ouvert") ?? false,
    );
    await interaction.reply(payload);
    hangmanGames.attach(gameId, interaction);
  },
};

export default command;
