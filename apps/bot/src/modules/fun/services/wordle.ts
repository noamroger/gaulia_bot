import { ButtonStyle, type ModalBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
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

/** Une lettre en double n'est marquée présente qu'autant de fois qu'elle figure dans la réponse. */
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

function statusLine(game: WordleGame, expired: boolean): string {
  const attempts = game.guesses.length;
  if (game.outcome === "won") return `Trouvé en ${attempts} essai${attempts > 1 ? "s" : ""} !`;
  if (game.outcome === "lost") return `Perdu ! Le mot était **${game.answer}**.`;
  if (game.outcome === "forfeit") return `Partie abandonnée. Le mot était **${game.answer}**.`;
  if (expired) return "Partie expirée après 10 minutes d'inactivité.";
  return `Essai ${attempts + 1} sur ${MAX_ATTEMPTS}.`;
}

/** `gameId` null : partie expirée, affichée sans contrôles. */
export function renderWordle(game: WordleGame, gameId: string | null): FunPayload {
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
    "### Wordle",
    `-# Partie de <@${game.playerId}> · mot français de ${WORDLE_LENGTH} lettres, accents ignorés`,
    "",
    ...board,
    "",
    ...(absent.length > 0 ? [`Lettres absentes : ${absent.join(", ")}`] : []),
    statusLine(game, gameId === null),
  ];

  if (!gameId || game.outcome) return funPayload(lines);

  return funPayload(lines, [
    funRow(
      funButton(`fun:wordle-open:${gameId}`, "Proposer un mot", ButtonStyle.Primary),
      funButton(`fun:wordle-quit:${gameId}`, "Abandonner", ButtonStyle.Danger),
    ),
  ]);
}

export const wordleGames = new GameStore<WordleGame>({
  idleMs: GAME_IDLE_MS,
  renderExpired: (game) => renderWordle(game, null),
});

export function startWordle(playerId: string): { gameId: string; payload: FunPayload } {
  const game: WordleGame = { answer: randomWordleAnswer(), guesses: [], playerId, outcome: null };
  const gameId = wordleGames.create(game);
  return { gameId, payload: renderWordle(game, gameId) };
}

export function requireWordlePlayer(gameId: string, userId: string): WordleGame {
  const game = wordleGames.require(gameId);
  if (game.playerId !== userId) {
    throw new GauliaError("Cette partie ne t'appartient pas. Lance la tienne avec `/wordle`.");
  }
  return game;
}

export function guessWordle(gameId: string, userId: string, input: string): FunPayload {
  const game = requireWordlePlayer(gameId, userId);
  const guess = normalizeWord(input);

  if (!/^[A-Z]{5}$/.test(guess)) {
    throw new GauliaError(`Propose un mot de ${WORDLE_LENGTH} lettres.`);
  }
  if (!isAcceptedWordleGuess(guess)) {
    throw new GauliaError(`« ${guess} » ne fait pas partie du dictionnaire de Gaulia.`);
  }
  if (game.guesses.includes(guess)) throw new GauliaError("Tu as déjà proposé ce mot.");

  game.guesses.push(guess);
  if (guess === game.answer) {
    game.outcome = "won";
  } else if (game.guesses.length >= MAX_ATTEMPTS) {
    game.outcome = "lost";
  }
  if (game.outcome) wordleGames.finish(gameId);

  return renderWordle(game, gameId);
}

export function forfeitWordle(gameId: string, userId: string): FunPayload {
  const game = requireWordlePlayer(gameId, userId);
  game.outcome = "forfeit";
  wordleGames.finish(gameId);
  return renderWordle(game, gameId);
}

export function wordleModal(gameId: string): ModalBuilder {
  return textInputModal(`fun:wordle-guess:${gameId}`, "Wordle", "Mot de 5 lettres", {
    min: WORDLE_LENGTH,
    max: WORDLE_LENGTH,
  });
}
