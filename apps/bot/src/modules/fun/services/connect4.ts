import { ButtonStyle } from "discord.js";

import { GauliaError } from "../../../core/errors";
import {
  difficultyLabel,
  funButton,
  funPayload,
  funRow,
  mention,
  type Difficulty,
  type FunPayload,
} from "./funUi";
import { GAME_IDLE_MS, GameStore } from "./gameStore";

const ROWS = 6;
const COLS = 7;
/** Colonnes centrales d'abord : meilleures en moyenne, donc plus d'élagage alpha-bêta. */
const COLUMN_ORDER = [3, 2, 4, 1, 5, 0, 6];
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;
const DISCS = ["⚪", "🔴", "🟡"] as const;
const COLUMN_HEADER = "1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣";
const WIN_SCORE = 1_000_000;
const SEARCH_DEPTH: Record<Difficulty, number> = { easy: 2, normal: 4, hard: 6 };
const EASY_RANDOM_MOVE_CHANCE = 0.35;

type Disc = 0 | 1 | 2;
type Player = 1 | 2;
type Outcome = { kind: "win" | "forfeit"; player: Player } | { kind: "draw" } | null;

export interface Connect4Game {
  board: Disc[];
  /** Rouge puis jaune ; `null` désigne Gaulia. */
  players: [string | null, string | null];
  turn: Player;
  difficulty: Difficulty;
  outcome: Outcome;
}

const opponentOf = (player: Player): Player => (player === 1 ? 2 : 1);

function playerAt(game: Connect4Game, player: Player): string | null {
  return game.players[player - 1] ?? null;
}

function dropRow(board: Disc[], column: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row * COLS + column] === 0) return row;
  }
  return -1;
}

function isWinningMove(board: Disc[], index: number, disc: Player): boolean {
  const row = Math.floor(index / COLS);
  const column = index % COLS;

  return DIRECTIONS.some(([rowStep, columnStep]) => {
    let aligned = 1;
    for (const sign of [1, -1]) {
      let r = row + rowStep * sign;
      let c = column + columnStep * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r * COLS + c] === disc) {
        aligned++;
        r += rowStep * sign;
        c += columnStep * sign;
      }
    }
    return aligned >= 4;
  });
}

function scoreWindow(board: Disc[], cells: number[], disc: Player): number {
  let mine = 0;
  let theirs = 0;
  for (const cell of cells) {
    if (board[cell] === disc) mine++;
    else if (board[cell] !== 0) theirs++;
  }
  const empty = 4 - mine - theirs;
  if (mine === 3 && empty === 1) return 5;
  if (mine === 2 && empty === 2) return 2;
  if (theirs === 3 && empty === 1) return -4;
  return 0;
}

function evaluate(board: Disc[], disc: Player): number {
  let score = 0;
  for (let row = 0; row < ROWS; row++) {
    if (board[row * COLS + 3] === disc) score += 3;
  }

  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLS; column++) {
      for (const [rowStep, columnStep] of DIRECTIONS) {
        const lastRow = row + rowStep * 3;
        const lastColumn = column + columnStep * 3;
        if (lastRow >= ROWS || lastColumn < 0 || lastColumn >= COLS) continue;
        const cells = [0, 1, 2, 3].map(
          (step) => (row + rowStep * step) * COLS + column + columnStep * step,
        );
        score += scoreWindow(board, cells, disc);
      }
    }
  }
  return score;
}

function negamax(board: Disc[], depth: number, alpha: number, beta: number, disc: Player): number {
  if (depth === 0) return evaluate(board, disc);

  let best = -Infinity;
  for (const column of COLUMN_ORDER) {
    const row = dropRow(board, column);
    if (row < 0) continue;

    const index = row * COLS + column;
    board[index] = disc;
    const score = isWinningMove(board, index, disc)
      ? WIN_SCORE + depth
      : -negamax(board, depth - 1, -beta, -alpha, opponentOf(disc));
    board[index] = 0;

    best = Math.max(best, score);
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }
  return best === -Infinity ? 0 : best;
}

function chooseAiColumn(board: Disc[], disc: Player, difficulty: Difficulty): number {
  const columns = COLUMN_ORDER.filter((column) => dropRow(board, column) >= 0);
  if (difficulty === "easy" && Math.random() < EASY_RANDOM_MOVE_CHANCE) {
    return columns[Math.floor(Math.random() * columns.length)]!;
  }

  const depth = SEARCH_DEPTH[difficulty];
  let bestScore = -Infinity;
  let bestColumns: number[] = [];

  for (const column of columns) {
    const index = dropRow(board, column) * COLS + column;
    board[index] = disc;
    const score = isWinningMove(board, index, disc)
      ? WIN_SCORE + depth
      : -negamax(board, depth - 1, -Infinity, Infinity, opponentOf(disc));
    board[index] = 0;

    if (score > bestScore) {
      bestScore = score;
      bestColumns = [column];
    } else if (score === bestScore) {
      bestColumns.push(column);
    }
  }

  return bestColumns[Math.floor(Math.random() * bestColumns.length)]!;
}

function applyMove(game: Connect4Game, column: number): void {
  const row = dropRow(game.board, column);
  if (row < 0) throw new GauliaError("Cette colonne est pleine.");

  const index = row * COLS + column;
  game.board[index] = game.turn;

  if (isWinningMove(game.board, index, game.turn)) {
    game.outcome = { kind: "win", player: game.turn };
  } else if (game.board.slice(0, COLS).every((cell) => cell !== 0)) {
    game.outcome = { kind: "draw" };
  } else {
    game.turn = opponentOf(game.turn);
  }
}

function statusLine(game: Connect4Game, expired: boolean): string {
  const { outcome } = game;
  if (outcome?.kind === "win") {
    return `${mention(playerAt(game, outcome.player))} ${DISCS[outcome.player]} remporte la partie !`;
  }
  if (outcome?.kind === "forfeit") {
    return `${mention(playerAt(game, outcome.player))} abandonne, ${mention(playerAt(game, opponentOf(outcome.player)))} remporte la partie.`;
  }
  if (outcome?.kind === "draw") return "Match nul, la grille est pleine.";
  if (expired) return "Partie expirée après 10 minutes d'inactivité.";
  return `Au tour de ${mention(playerAt(game, game.turn))} ${DISCS[game.turn]}`;
}

/** `gameId` null : partie expirée, affichée sans contrôles. */
export function renderConnect4(game: Connect4Game, gameId: string | null): FunPayload {
  const vsAi = game.players.includes(null);
  const grid = Array.from({ length: ROWS }, (_, row) =>
    game.board
      .slice(row * COLS, (row + 1) * COLS)
      .map((cell) => DISCS[cell])
      .join(""),
  ).join("\n");

  const lines = [
    "### Puissance 4",
    `${DISCS[1]} ${mention(game.players[0])} contre ${DISCS[2]} ${mention(game.players[1])}${vsAi ? ` · difficulté ${difficultyLabel(game.difficulty)}` : ""}`,
    "",
    COLUMN_HEADER,
    grid,
    "",
    statusLine(game, gameId === null),
  ];

  if (!gameId || game.outcome) return funPayload(lines);

  const columnButton = (column: number) =>
    funButton(
      `fun:c4:${gameId}:${column}`,
      String(column + 1),
      ButtonStyle.Secondary,
      dropRow(game.board, column) < 0,
    );

  return funPayload(lines, [
    funRow(...[0, 1, 2, 3].map(columnButton)),
    funRow(
      ...[4, 5, 6].map(columnButton),
      funButton(`fun:c4-quit:${gameId}`, "Abandonner", ButtonStyle.Danger),
    ),
  ]);
}

export const connect4Games = new GameStore<Connect4Game>({
  idleMs: GAME_IDLE_MS,
  renderExpired: (game) => renderConnect4(game, null),
});

export function startConnect4(
  players: [string | null, string | null],
  difficulty: Difficulty,
): { gameId: string; payload: FunPayload } {
  const game: Connect4Game = {
    board: Array<Disc>(ROWS * COLS).fill(0),
    players,
    turn: 1,
    difficulty,
    outcome: null,
  };
  const gameId = connect4Games.create(game);
  return { gameId, payload: renderConnect4(game, gameId) };
}

export function playConnect4(gameId: string, userId: string, column: number): FunPayload {
  const game = connect4Games.require(gameId);
  if (!game.players.includes(userId)) {
    throw new GauliaError("Tu ne participes pas à cette partie.");
  }
  if (playerAt(game, game.turn) !== userId) throw new GauliaError("Ce n'est pas ton tour.");
  if (!Number.isInteger(column) || column < 0 || column >= COLS) {
    throw new GauliaError("Colonne invalide.");
  }

  applyMove(game, column);
  if (!game.outcome && playerAt(game, game.turn) === null) {
    applyMove(game, chooseAiColumn(game.board, game.turn, game.difficulty));
  }
  if (game.outcome) connect4Games.finish(gameId);

  return renderConnect4(game, gameId);
}

export function forfeitConnect4(gameId: string, userId: string): FunPayload {
  const game = connect4Games.require(gameId);
  const index = game.players.indexOf(userId);
  if (index === -1) throw new GauliaError("Tu ne participes pas à cette partie.");

  game.outcome = { kind: "forfeit", player: index === 0 ? 1 : 2 };
  connect4Games.finish(gameId);
  return renderConnect4(game, gameId);
}
