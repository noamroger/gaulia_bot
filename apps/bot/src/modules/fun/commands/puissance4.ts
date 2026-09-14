import { SlashCommandBuilder } from "discord.js";

import type { ChatInputCommand } from "../../../structures/Command";
import { startDuelCommand } from "../services/duel";
import { DIFFICULTY_CHOICES } from "../services/funUi";

const command: ChatInputCommand = {
  type: "chatInput",
  cooldownSeconds: 3,
  data: new SlashCommandBuilder()
    .setName("puissance4")
    .setDescription("Lance une partie de puissance 4 contre un membre ou contre Gaulia")
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
      "Aligne 4 jetons horizontalement, verticalement ou en diagonale avant ton adversaire. Avec un adversaire, il reçoit un défi à accepter dans les 2 minutes et le premier joueur est tiré au sort. Sans adversaire, tu affrontes Gaulia avec la difficulté de ton choix. Une partie sans coup joué pendant 10 minutes expire.",
    examples: ["puissance4 adversaire:@Pseudo", "puissance4 difficulte:Difficile"],
  },

  async execute(interaction) {
    await startDuelCommand(interaction, "connect4");
  },
};

export default command;
