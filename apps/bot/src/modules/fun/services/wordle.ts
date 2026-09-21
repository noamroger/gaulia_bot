import { ButtonStyle, type ModalBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import type { Translator } from "../../../i18n";
import { funButton, funPayload, funRow, textInputModal, type FunPayload } from "./funUi";
import { GAME_IDLE_MS, GameStore } from "./gameStore";
import { WORDLE_LENGTH, isAcceptedWordleGuess, normalizeWord, randomWordleAnswer } from "./words";

const MAX_ATTEMPTS = 6;
const SQUARES = { hit: "🟩", present: "🟨", miss: "⬛" } as const;
const EMPTY_ROW = "⬜".repeat(WORDLE_LENGTH);

type LetterScore = keyof typeof SQUARES;
type Outcome = "won" | "lost" | "forfeit" | null;

export interface WordleGame {
  answer: string;
  guesses: string[];
  playerId: string;
  outcome: Outcome;
}

/** A repeated letter is only marked present as many times as it appears in the answer. */
export function scoreGuess(guess: string, answer: string): LetterScore[] {
  const scores = Array<LetterScore>(WORDLE_LENGTH).fill("miss");
  const remaining = new Map<string, number>();

  for (let index = 0; index < WORDLE_LENGTH; index++) {
    const letter = answer.charAt(index);
    if (guess.charAt(index) === letter) {
      scores[index] = "hit";
    } else {
      remaining.set(letter, (remaining.get(letter) ?? 0) + 1);
    }
  }

  for (let index = 0; index < WORDLE_LENGTH; index++) {
    const letter = guess.charAt(index);
    const left = remaining.get(letter) ?? 0;
    if (scores[index] !== "hit" && left > 0) {
      scores[index] = "present";
      remaining.set(letter, left - 1);
    }
  }

  return scores;
}

function statusLine(game: WordleGame, expired: boolean, t: Translator): string {
  const attempts = game.guesses.length;
  if (game.outcome === "won") return t("fun.wordle.won", { count: attempts });
  if (game.outcome === "lost") return t("fun.wordle.lost", { word: game.answer });
  if (game.outcome === "forfeit") return t("fun.wordle.forfeited", { word: game.answer });
  if (expired) return t("fun.game.expired");
  return t("fun.wordle.attempt", { current: attempts + 1, max: MAX_ATTEMPTS });
}

/** A null `gameId` means the game expired and is shown without controls. */
export function renderWordle(game: WordleGame, gameId: string | null, t: Translator): FunPayload {
  const board = Array.from({ length: MAX_ATTEMPTS }, (_, attempt) => {
    const guess = game.guesses[attempt];
    if (!guess) return EMPTY_ROW;
    const squares = scoreGuess(guess, game.answer)
      .map((score) => SQUARES[score])
      .join("");
    return `${squares}  \`${[...guess].join(" ")}\``;
  });
  const absent = [...new Set(game.guesses.join(""))]
    .filter((letter) => !game.answer.includes(letter))
    .sort();

  const lines = [
    `### ${t("fun.wordle.title")}`,
    `-# ${t("fun.wordle.subtitle", { player: `<@${game.playerId}>`, length: WORDLE_LENGTH })}`,
    "",
    ...board,
    "",
    ...(absent.length > 0 ? [t("fun.wordle.absent", { letters: absent.join(", ") })] : []),
    statusLine(game, gameId === null, t),
  ];

  if (!gameId || game.outcome) return funPayload(lines);

  return funPayload(lines, [
    funRow(
      funButton(`fun:wordle-open:${gameId}`, t("fun.wordle.guessButton"), ButtonStyle.Primary),
      funButton(`fun:wordle-quit:${gameId}`, t("fun.game.forfeitButton"), ButtonStyle.Danger),
    ),
  ]);
}

export const wordleGames = new GameStore<WordleGame>({
  idleMs: GAME_IDLE_MS,
  renderExpired: (game, t) => renderWordle(game, null, t),
});

export function startWordle(
  playerId: string,
  t: Translator,
): { gameId: string; payload: FunPayload } {
  const game: WordleGame = {
    answer: randomWordleAnswer(t.locale),
    guesses: [],
    playerId,
    outcome: null,
  };
  const gameId = wordleGames.create(game, t);
  return { gameId, payload: renderWordle(game, gameId, t) };
}

export function requireWordlePlayer(gameId: string, userId: string): WordleGame {
  const game = wordleGames.require(gameId);
  if (game.playerId !== userId) throw new GauliaError("fun.wordle.notYours");
  return game;
}

export function guessWordle(
  gameId: string,
  userId: string,
  input: string,
  t: Translator,
): FunPayload {
  const game = requireWordlePlayer(gameId, userId);
  const guess = normalizeWord(input);

  if (!/^[A-Z]{5}$/.test(guess)) {
    throw new GauliaError("fun.wordle.wrongLength", { length: WORDLE_LENGTH });
  }
  if (!isAcceptedWordleGuess(guess, t.locale)) {
    throw new GauliaError("fun.wordle.unknownWord", { word: guess });
  }
  if (game.guesses.includes(guess)) throw new GauliaError("fun.wordle.alreadyTried");

  game.guesses.push(guess);
  if (guess === game.answer) {
    game.outcome = "won";
  } else if (game.guesses.length >= MAX_ATTEMPTS) {
    game.outcome = "lost";
  }
  if (game.outcome) wordleGames.finish(gameId);

  return renderWordle(game, gameId, t);
}

export function forfeitWordle(gameId: string, userId: string, t: Translator): FunPayload {
  const game = requireWordlePlayer(gameId, userId);
  game.outcome = "forfeit";
  wordleGames.finish(gameId);
  return renderWordle(game, gameId, t);
}

export function wordleModal(gameId: string, t: Translator): ModalBuilder {
  return textInputModal(
    `fun:wordle-guess:${gameId}`,
    t("fun.wordle.title"),
    t("fun.wordle.modalLabel", { length: WORDLE_LENGTH }),
    { min: WORDLE_LENGTH, max: WORDLE_LENGTH },
  );
}
