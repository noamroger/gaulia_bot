import { SlashCommandBuilder } from "discord.js";

import type { ChatInputCommand } from "../../../structures/Command";
import { startWordle, wordleGames } from "../services/wordle";

const command: ChatInputCommand = {
  type: "chatInput",
  cooldownSeconds: 3,
  data: new SlashCommandBuilder()
    .setName("wordle")
    .setDescription("Trouve un mot français de 5 lettres en 6 essais"),

  help: {
    details:
      "Propose des mots de 5 lettres pour trouver le mot mystère. Après chaque essai, un carré vert indique une lettre bien placée, un carré jaune une lettre présente ailleurs et un carré noir une lettre absente. Les accents sont ignorés et le mot proposé doit exister dans le dictionnaire de Gaulia.",
    examples: ["wordle"],
  },

  async execute(interaction) {
    const { gameId, payload } = startWordle(interaction.user.id);
    await interaction.reply(payload);
    wordleGames.attach(gameId, interaction);
  },
};

export default command;
