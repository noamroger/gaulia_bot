import { randomInt } from "node:crypto";

import { SlashCommandBuilder } from "discord.js";

import type { ChatInputCommand } from "../../../structures/Command";
import {
  DIFFICULTY_CHOICES,
  difficultyLabel,
  funPayload,
  parseDifficulty,
  type Difficulty,
} from "../services/funUi";

const LEVELS: Record<Difficulty, { size: number; mines: number }> = {
  easy: { size: 6, mines: 5 },
  normal: { size: 8, mines: 10 },
  hard: { size: 9, mines: 16 },
};
const NUMBER_EMOJIS = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];
const MINE_EMOJI = "💣";

/** Grille en spoilers ; une case sans mine (sans voisine piégée si possible) est laissée visible. */
export function buildMinesweeperGrid(size: number, mines: number): string {
  const cellCount = size * size;
  const mineCells = new Set<number>();
  while (mineCells.size < mines) mineCells.add(randomInt(cellCount));

  const neighbourMines = (cell: number): number => {
    const row = Math.floor(cell / size);
    const column = cell % size;
    let count = 0;
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = column - 1; c <= column + 1; c++) {
        if (r >= 0 && r < size && c >= 0 && c < size && mineCells.has(r * size + c)) count++;
      }
    }
    return count;
  };

  const counts = Array.from({ length: cellCount }, (_, cell) =>
    mineCells.has(cell) ? -1 : neighbourMines(cell),
  );
  const emptyCells = counts.flatMap((count, cell) => (count === 0 ? [cell] : []));
  const safeCells = counts.flatMap((count, cell) => (count >= 0 ? [cell] : []));
  const startPool = emptyCells.length > 0 ? emptyCells : safeCells;
  const start = startPool[randomInt(startPool.length)];

  return Array.from({ length: size }, (_, row) =>
    counts
      .slice(row * size, (row + 1) * size)
      .map((count, column) => {
        const emoji = count < 0 ? MINE_EMOJI : NUMBER_EMOJIS[count];
        return row * size + column === start ? emoji : `||${emoji}||`;
      })
      .join(""),
  ).join("\n");
}

const command: ChatInputCommand = {
  type: "chatInput",
  cooldownSeconds: 3,
  data: new SlashCommandBuilder()
    .setName("demineur")
    .setDescription("Génère une grille de démineur à découvrir")
    .addStringOption((option) =>
      option
        .setName("difficulte")
        .setDescription("Taille de la grille et nombre de mines (normale par défaut)")
        .addChoices(...DIFFICULTY_CHOICES),
    ),

  help: {
    details:
      "Affiche une grille dont les cases sont cachées : clique dessus pour les découvrir sans tomber sur une mine. Chaque chiffre indique le nombre de mines dans les cases voisines, et une case sans danger est déjà révélée pour commencer. Facile : 6×6 et 5 mines, normale : 8×8 et 10 mines, difficile : 9×9 et 16 mines.",
    examples: ["demineur", "demineur difficulte:Difficile"],
  },

  async execute(interaction) {
    const difficulty = parseDifficulty(interaction.options.getString("difficulte"));
    const { size, mines } = LEVELS[difficulty];

    await interaction.reply(
      funPayload([
        "### Démineur",
        `Grille ${size}×${size} · ${mines} mines · difficulté ${difficultyLabel(difficulty)}`,
        "-# Clique sur les cases pour les découvrir ; une case sans danger est déjà révélée.",
        "",
        buildMinesweeperGrid(size, mines),
      ]),
    );
  },
};

export default command;
