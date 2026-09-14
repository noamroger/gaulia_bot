import { SlashCommandBuilder } from "discord.js";

import type { ChatInputCommand } from "../../../structures/Command";
import { blackjackGames, startBlackjack } from "../services/blackjack";

const command: ChatInputCommand = {
  type: "chatInput",
  cooldownSeconds: 3,
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("Affronte le croupier au blackjack"),

  help: {
    details:
      "Approche-toi le plus possible de 21 sans le dépasser. « Tirer » ajoute une carte à ta main, « Rester » laisse jouer le croupier, qui tire jusqu'à atteindre 17. Les figures valent 10 et l'as 1 ou 11. Aucune mise : on joue pour le plaisir.",
    examples: ["blackjack"],
  },

  async execute(interaction) {
    const { gameId, payload } = startBlackjack(interaction.user.id);
    await interaction.reply(payload);
    blackjackGames.attach(gameId, interaction);
  },
};

export default command;
