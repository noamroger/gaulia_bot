import { ButtonStyle, StringSelectMenuBuilder, type ModalBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import type { Translator } from "../../../i18n";
import {
  funButton,
  funPayload,
  funRow,
  textInputModal,
  type FunPayload,
  type FunRow,
} from "./funUi";
import { GAME_IDLE_MS, GameStore } from "./gameStore";
import { normalizeWord, randomHangmanWord } from "./words";

const MAX_ERRORS = 6;
const LETTER_GROUPS = ["ABCDEFGHIJKLM", "NOPQRSTUVWXYZ"] as const;
const WORD_INPUT_LENGTH = { min: 2, max: 30 };

const STAGES = [
  "  +---+\n  |   |\n      |\n      |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n      |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n  |   |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n /|   |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n=========",
  "  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n=========",
];

type Outcome = { kind: "won"; by: string } | { kind: "lost" } | { kind: "forfeit" } | null;

export interface HangmanGame {
  /** Word as displayed, accents included. */
  word: string;
  /** Same word without accents, letter for letter with `word`. */
  target: string;
  guessed: string[];
  missed: string[];
  errors: number;
  ownerId: string;
  /** Every member of the channel may play. */
  open: boolean;
  lastAction: string | null;
  outcome: Outcome;
}

function maskedWord(game: HangmanGame): string {
  const reveal = game.outcome !== null;
  return [...game.word]
    .map((char, index) => (reveal || game.guessed.includes(game.target.charAt(index)) ? char : "_"))
    .join(" ");
}

function statusLine(game: HangmanGame, expired: boolean, t: Translator): string {
  const { outcome } = game;
  if (outcome?.kind === "won") {
    return game.open
      ? t("fun.hangman.wonOpen", { player: `<@${outcome.by}>` })
      : t("fun.hangman.wonSolo", { count: game.errors });
  }
  if (outcome?.kind === "lost") return t("fun.hangman.lost", { word: game.word });
  if (outcome?.kind === "forfeit") return t("fun.hangman.forfeited", { word: game.word });
  if (expired) return t("fun.game.expired");
  return game.open
    ? t("fun.hangman.openStatus")
    : t("fun.hangman.ownerStatus", { player: `<@${game.ownerId}>` });
}

function letterSelect(
  gameId: string,
  game: HangmanGame,
  group: 0 | 1,
  t: Translator,
): StringSelectMenuBuilder | null {
  const range = LETTER_GROUPS[group];
  const letters = [...range].filter((letter) => !game.guessed.includes(letter));
  if (letters.length === 0) return null;

  return new StringSelectMenuBuilder()
    .setCustomId(`fun:hangman-letter:${gameId}:${group}`)
    .setPlaceholder(
      t("fun.hangman.letterRange", {
        first: range.charAt(0),
        last: range.charAt(range.length - 1),
      }),
    )
    .addOptions(letters.map((letter) => ({ label: letter, value: letter })));
}

/** A null `gameId` means the game expired and is shown without controls. */
export function renderHangman(game: HangmanGame, gameId: string | null, t: Translator): FunPayload {
  const lines = [
    `### ${t("fun.hangman.title")}`,
    `\`\`\`\n${STAGES[Math.min(game.errors, MAX_ERRORS)]}\n\`\`\``,
    t("fun.hangman.word", { word: maskedWord(game) }),
    t("fun.hangman.missed", {
      letters: game.missed.length > 0 ? game.missed.join(", ") : t("fun.hangman.missedNone"),
    }),
    t("fun.hangman.mistakes", { count: game.errors, max: MAX_ERRORS }),
    ...(game.lastAction && !game.outcome ? [`-# ${game.lastAction}`] : []),
    "",
    statusLine(game, gameId === null, t),
  ];

  if (!gameId || game.outcome) return funPayload(lines);

  const rows: FunRow[] = [0, 1].flatMap((group) => {
    const select = letterSelect(gameId, game, group as 0 | 1, t);
    return select ? [funRow(select)] : [];
  });
  rows.push(
    funRow(
      funButton(`fun:hangman-word:${gameId}`, t("fun.hangman.solveButton"), ButtonStyle.Primary),
      funButton(`fun:hangman-quit:${gameId}`, t("fun.game.forfeitButton"), ButtonStyle.Danger),
    ),
  );

  return funPayload(lines, rows);
}

export const hangmanGames = new GameStore<HangmanGame>({
  idleMs: GAME_IDLE_MS,
  renderExpired: (game, t) => renderHangman(game, null, t),
});

export function startHangman(
  ownerId: string,
  open: boolean,
  t: Translator,
): { gameId: string; payload: FunPayload } {
  const word = randomHangmanWord(t.locale);
  const game: HangmanGame = {
    word,
    target: normalizeWord(word),
    guessed: [],
    missed: [],
    errors: 0,
    ownerId,
    open,
    lastAction: null,
    outcome: null,
  };
  const gameId = hangmanGames.create(game, t);
  return { gameId, payload: renderHangman(game, gameId, t) };
}

/** Returns the game when this member is allowed to play it. */
export function requireHangmanPlayer(gameId: string, userId: string): HangmanGame {
  const game = hangmanGames.require(gameId);
  if (!game.open && game.ownerId !== userId) throw new GauliaError("fun.hangman.notYours");
  return game;
}

function settle(gameId: string, game: HangmanGame, userId: string): void {
  if ([...game.target].every((letter) => game.guessed.includes(letter))) {
    game.outcome = { kind: "won", by: userId };
  } else if (game.errors >= MAX_ERRORS) {
    game.outcome = { kind: "lost" };
  }
  if (game.outcome) hangmanGames.finish(gameId);
}

export function guessHangmanLetter(
  gameId: string,
  userId: string,
  letter: string,
  t: Translator,
): FunPayload {
  const game = requireHangmanPlayer(gameId, userId);
  if (!/^[A-Z]$/.test(letter)) throw new GauliaError("fun.hangman.invalidLetter");
  if (game.guessed.includes(letter)) throw new GauliaError("fun.hangman.alreadyGuessed");

  game.guessed.push(letter);
  const hit = game.target.includes(letter);
  if (!hit) {
    game.missed.push(letter);
    game.errors++;
  }
  game.lastAction = t("fun.hangman.guessLetter", {
    player: `<@${userId}>`,
    letter,
    result: hit ? t("fun.hangman.hit") : t("fun.hangman.miss"),
  });
  settle(gameId, game, userId);

  return renderHangman(game, gameId, t);
}

export function guessHangmanWord(
  gameId: string,
  userId: string,
  input: string,
  t: Translator,
): FunPayload {
  const game = requireHangmanPlayer(gameId, userId);
  const guess = normalizeWord(input);
  if (!/^[A-Z]+$/.test(guess)) throw new GauliaError("fun.hangman.lettersOnly");

  if (guess === game.target) {
    game.guessed = [...new Set([...game.guessed, ...game.target])];
  } else {
    game.errors++;
    game.lastAction = t("fun.hangman.guessWord", { player: `<@${userId}>`, word: guess });
  }
  settle(gameId, game, userId);

  return renderHangman(game, gameId, t);
}

export function forfeitHangman(gameId: string, userId: string, t: Translator): FunPayload {
  const game = hangmanGames.require(gameId);
  if (game.ownerId !== userId) throw new GauliaError("fun.hangman.ownerOnlyForfeit");
  game.outcome = { kind: "forfeit" };
  hangmanGames.finish(gameId);
  return renderHangman(game, gameId, t);
}

export function hangmanWordModal(gameId: string, t: Translator): ModalBuilder {
  return textInputModal(
    `fun:hangman-solve:${gameId}`,
    t("fun.hangman.title"),
    t("fun.hangman.modalLabel"),
    WORD_INPUT_LENGTH,
  );
}
