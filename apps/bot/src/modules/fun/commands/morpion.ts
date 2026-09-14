import { SlashCommandBuilder } from "discord.js";

import type { ChatInputCommand } from "../../../structures/Command";
import { startDuelCommand } from "../services/duel";
import { DIFFICULTY_CHOICES } from "../services/funUi";

const command: ChatInputCommand = {
  type: "chatInput",
  cooldownSeconds: 3,
  data: new SlashCommandBuilder()
    .setName("morpion")
    .setDescription("Lance une partie de morpion contre un membre ou contre Gaulia")
    .addUserOption((option) =>
      option
        .setName("adversaire")
        .setDescription("Membre à défier ; sans membre, tu joues contre Gaulia"),
    )
    .addStringOption((option) =>
      option
        .setName("difficulte")
        .setDescription("Difficulté quand tu joues contre Gaulia (normale par défaut)")
        .addChoices(...DIFFICULTY_CHOICES),
    ),

  help: {
    details:
      "Aligne 3 symboles sur la grille avant ton adversaire en cliquant sur les cases. Avec un adversaire, il reçoit un défi à accepter dans les 2 minutes et le premier joueur est tiré au sort. Sans adversaire, tu affrontes Gaulia : en difficile, elle ne perd jamais. Une partie sans coup joué pendant 10 minutes expire.",
    examples: ["morpion adversaire:@Pseudo", "morpion difficulte:Facile"],
  },

  async execute(interaction) {
    await startDuelCommand(interaction, "tictactoe");
  },
};

export default command;
