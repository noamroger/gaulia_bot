import { randomInt } from "node:crypto";

import { SlashCommandBuilder } from "discord.js";

import { localizeChoices, localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import {
  DIFFICULTIES,
  difficultyLabel,
  funPayload,
  parseDifficulty,
  type Difficulty,
} from "../services/funUi";

const KEY = "fun.commands.minesweeper";

const LEVELS: Record<Difficulty, { size: number; mines: number }> = {
  easy: { size: 6, mines: 5 },
  normal: { size: 8, mines: 10 },
  hard: { size: 9, mines: 16 },
};
const NUMBER_EMOJIS = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];
const MINE_EMOJI = "💣";

/** Grid of spoilers; one mine free cell (with no trapped neighbour when possible) is left visible. */
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
  i18nKey: KEY,
  cooldownSeconds: 3,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY).addStringOption((option) =>
    localizeOption(option, `${KEY}.options.difficulty`).addChoices(
      ...localizeChoices(`${KEY}.options.difficulty`, DIFFICULTIES),
    ),
  ),

  async execute(interaction, _client, t) {
    const difficulty = parseDifficulty(interaction.options.getString("difficulty"));
    const { size, mines } = LEVELS[difficulty];

    await interaction.reply(
      funPayload([
        `### ${t("fun.minesweeper.title")}`,
        t("fun.minesweeper.summary", {
          size,
          mines,
          difficulty: difficultyLabel(difficulty, t),
        }),
        `-# ${t("fun.minesweeper.hint")}`,
        "",
        buildMinesweeperGrid(size, mines),
      ]),
    );
  },
};

export default command;
