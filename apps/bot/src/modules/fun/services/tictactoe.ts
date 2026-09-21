import { ButtonBuilder, ButtonStyle } from "discord.js";

import { GauliaError } from "../../../core/errors";
import type { Translator } from "../../../i18n";
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

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;
const MARKS = { 1: "❌", 2: "⭕" } as const;
/** Odds that Gaulia plays the best move instead of a random one. */
const OPTIMAL_MOVE_CHANCE: Record<Difficulty, number> = { easy: 0.3, normal: 0.75, hard: 1 };
const EMPTY_CELL_LABEL = "​";
const CELL_COUNT = 9;

type Mark = 0 | 1 | 2;
type Player = 1 | 2;
type Outcome = { kind: "win" | "forfeit"; player: Player } | { kind: "draw" } | null;

export interface TicTacToeGame {
  board: Mark[];
  /** Cross then circle; `null` stands for Gaulia. */
  players: [string | null, string | null];
  turn: Player;
  difficulty: Difficulty;
  outcome: Outcome;
}

const opponentOf = (player: Player): Player => (player === 1 ? 2 : 1);

function playerAt(game: TicTacToeGame, player: Player): string | null {
  return game.players[player - 1] ?? null;
}

function winnerOf(board: Mark[]): Mark {
  for (const [a, b, c] of LINES) {
    const mark = board[a];
    if (mark && mark === board[b] && mark === board[c]) return mark;
  }
  return 0;
}

function negamax(board: Mark[], player: Player, depth: number): number {
  let best = -Infinity;
  for (let cell = 0; cell < CELL_COUNT; cell++) {
    if (board[cell] !== 0) continue;
    board[cell] = player;
    const score =
      winnerOf(board) === player ? 10 - depth : -negamax(board, opponentOf(player), depth + 1);
    board[cell] = 0;
    best = Math.max(best, score);
  }
  return best === -Infinity ? 0 : best;
}

function chooseAiCell(board: Mark[], player: Player, difficulty: Difficulty): number {
  const empty = board.flatMap((mark, cell) => (mark === 0 ? [cell] : []));
  if (Math.random() >= OPTIMAL_MOVE_CHANCE[difficulty]) {
    return empty[Math.floor(Math.random() * empty.length)]!;
  }

  let bestScore = -Infinity;
  let bestCells: number[] = [];
  for (const cell of empty) {
    board[cell] = player;
    const score = winnerOf(board) === player ? 10 : -negamax(board, opponentOf(player), 1);
    board[cell] = 0;
    if (score > bestScore) {
      bestScore = score;
      bestCells = [cell];
    } else if (score === bestScore) {
      bestCells.push(cell);
    }
  }
  return bestCells[Math.floor(Math.random() * bestCells.length)]!;
}

function applyMove(game: TicTacToeGame, cell: number): void {
  if (game.board[cell] !== 0) throw new GauliaError("fun.tictactoe.cellTaken");
  game.board[cell] = game.turn;

  if (winnerOf(game.board) === game.turn) {
    game.outcome = { kind: "win", player: game.turn };
  } else if (game.board.every((mark) => mark !== 0)) {
    game.outcome = { kind: "draw" };
  } else {
    game.turn = opponentOf(game.turn);
  }
}

function statusLine(game: TicTacToeGame, expired: boolean, t: Translator): string {
  const { outcome } = game;
  if (outcome?.kind === "win") {
    return t("fun.match.win", {
      player: mention(playerAt(game, outcome.player), t),
      mark: MARKS[outcome.player],
    });
  }
  if (outcome?.kind === "forfeit") {
    return t("fun.match.forfeited", {
      loser: mention(playerAt(game, outcome.player), t),
      winner: mention(playerAt(game, opponentOf(outcome.player)), t),
    });
  }
  if (outcome?.kind === "draw") return t("fun.tictactoe.draw");
  if (expired) return t("fun.game.expired");
  return t("fun.match.turn", {
    player: mention(playerAt(game, game.turn), t),
    mark: MARKS[game.turn],
  });
}

/** A null `gameId` means the game expired and its grid is frozen. */
export function renderTicTacToe(
  game: TicTacToeGame,
  gameId: string | null,
  t: Translator,
): FunPayload {
  const vsAi = game.players.includes(null);
  const playable = gameId !== null && game.outcome === null;

  const cellButton = (cell: number): ButtonBuilder => {
    const mark = game.board[cell] ?? 0;
    const button = new ButtonBuilder()
      .setCustomId(`fun:ttt:${gameId ?? "end"}:${cell}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!playable || mark !== 0);
    return mark === 0 ? button.setLabel(EMPTY_CELL_LABEL) : button.setEmoji(MARKS[mark]);
  };

  const rows = [0, 3, 6].map((start) =>
    funRow(...[0, 1, 2].map((step) => cellButton(start + step))),
  );
  if (playable) {
    rows.push(
      funRow(funButton(`fun:ttt-quit:${gameId}`, t("fun.game.forfeitButton"), ButtonStyle.Danger)),
    );
  }

  const players = t("fun.match.players", {
    firstMark: MARKS[1],
    first: mention(game.players[0], t),
    secondMark: MARKS[2],
    second: mention(game.players[1], t),
  });
  const difficulty = vsAi
    ? ` · ${t("fun.game.difficultyNote", { difficulty: difficultyLabel(game.difficulty, t) })}`
    : "";

  return funPayload(
    [
      `### ${t("fun.tictactoe.title")}`,
      `${players}${difficulty}`,
      "",
      statusLine(game, gameId === null, t),
    ],
    rows,
  );
}

export const ticTacToeGames = new GameStore<TicTacToeGame>({
  idleMs: GAME_IDLE_MS,
  renderExpired: (game, t) => renderTicTacToe(game, null, t),
});

export function startTicTacToe(
  players: [string | null, string | null],
  difficulty: Difficulty,
  t: Translator,
): { gameId: string; payload: FunPayload } {
  const game: TicTacToeGame = {
    board: Array<Mark>(CELL_COUNT).fill(0),
    players,
    turn: 1,
    difficulty,
    outcome: null,
  };
  const gameId = ticTacToeGames.create(game, t);
  return { gameId, payload: renderTicTacToe(game, gameId, t) };
}

export function playTicTacToe(
  gameId: string,
  userId: string,
  cell: number,
  t: Translator,
): FunPayload {
  const game = ticTacToeGames.require(gameId);
  if (!game.players.includes(userId)) throw new GauliaError("fun.match.notPlaying");
  if (playerAt(game, game.turn) !== userId) throw new GauliaError("fun.match.notYourTurn");
  if (!Number.isInteger(cell) || cell < 0 || cell >= CELL_COUNT) {
    throw new GauliaError("fun.tictactoe.invalidCell");
  }

  applyMove(game, cell);
  if (!game.outcome && playerAt(game, game.turn) === null) {
    applyMove(game, chooseAiCell(game.board, game.turn, game.difficulty));
  }
  if (game.outcome) ticTacToeGames.finish(gameId);

  return renderTicTacToe(game, gameId, t);
}

export function forfeitTicTacToe(gameId: string, userId: string, t: Translator): FunPayload {
  const game = ticTacToeGames.require(gameId);
  const index = game.players.indexOf(userId);
  if (index === -1) throw new GauliaError("fun.match.notPlaying");

  game.outcome = { kind: "forfeit", player: index === 0 ? 1 : 2 };
  ticTacToeGames.finish(gameId);
  return renderTicTacToe(game, gameId, t);
}
