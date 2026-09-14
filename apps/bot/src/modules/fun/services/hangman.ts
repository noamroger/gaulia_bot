import { ButtonStyle, StringSelectMenuBuilder, type ModalBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
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
  /** Mot affiché, accents compris. */
  word: string;
  /** Même mot sans accents, lettre à lettre alignée sur `word`. */
  target: string;
  guessed: string[];
  missed: string[];
  errors: number;
  ownerId: string;
  /** Tous les membres du salon peuvent jouer. */
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

function statusLine(game: HangmanGame, expired: boolean): string {
  const { outcome } = game;
  if (outcome?.kind === "won") {
    return game.open
      ? `<@${outcome.by}> trouve le mot, bravo !`
      : `Bravo, tu as trouvé le mot avec ${game.errors} erreur(s) !`;
  }
  if (outcome?.kind === "lost") return `Perdu ! Le mot était **${game.word}**.`;
  if (outcome?.kind === "forfeit") return `Partie abandonnée. Le mot était **${game.word}**.`;
  if (expired) return "Partie expirée après 10 minutes d'inactivité.";
  return game.open ? "Tout le monde peut proposer une lettre." : `Partie de <@${game.ownerId}>.`;
}

function letterSelect(
  gameId: string,
  game: HangmanGame,
  group: 0 | 1,
): StringSelectMenuBuilder | null {
  const letters = [...LETTER_GROUPS[group]].filter((letter) => !game.guessed.includes(letter));
  if (letters.length === 0) return null;

  return new StringSelectMenuBuilder()
    .setCustomId(`fun:hangman-letter:${gameId}:${group}`)
    .setPlaceholder(group === 0 ? "Lettre de A à M" : "Lettre de N à Z")
    .addOptions(letters.map((letter) => ({ label: letter, value: letter })));
}

/** `gameId` null : partie expirée, affichée sans contrôles. */
export function renderHangman(game: HangmanGame, gameId: string | null): FunPayload {
  const lines = [
    "### Pendu",
    `\`\`\`\n${STAGES[Math.min(game.errors, MAX_ERRORS)]}\n\`\`\``,
    `Mot : \`${maskedWord(game)}\``,
    `Lettres ratées : ${game.missed.length > 0 ? game.missed.join(", ") : "aucune"}`,
    `Erreurs : ${game.errors} / ${MAX_ERRORS}`,
    ...(game.lastAction && !game.outcome ? [`-# ${game.lastAction}`] : []),
    "",
    statusLine(game, gameId === null),
  ];

  if (!gameId || game.outcome) return funPayload(lines);

  const rows: FunRow[] = [0, 1].flatMap((group) => {
    const select = letterSelect(gameId, game, group as 0 | 1);
    return select ? [funRow(select)] : [];
  });
  rows.push(
    funRow(
      funButton(`fun:hangman-word:${gameId}`, "Proposer le mot", ButtonStyle.Primary),
      funButton(`fun:hangman-quit:${gameId}`, "Abandonner", ButtonStyle.Danger),
    ),
  );

  return funPayload(lines, rows);
}

export const hangmanGames = new GameStore<HangmanGame>({
  idleMs: GAME_IDLE_MS,
  renderExpired: (game) => renderHangman(game, null),
});

export function startHangman(
  ownerId: string,
  open: boolean,
): { gameId: string; payload: FunPayload } {
  const word = randomHangmanWord();
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
  const gameId = hangmanGames.create(game);
  return { gameId, payload: renderHangman(game, gameId) };
}

/** Retourne la partie si ce membre peut y jouer. */
export function requireHangmanPlayer(gameId: string, userId: string): HangmanGame {
  const game = hangmanGames.require(gameId);
  if (!game.open && game.ownerId !== userId) {
    throw new GauliaError("Cette partie ne t'appartient pas. Lance la tienne avec `/pendu`.");
  }
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

export function guessHangmanLetter(gameId: string, userId: string, letter: string): FunPayload {
  const game = requireHangmanPlayer(gameId, userId);
  if (!/^[A-Z]$/.test(letter)) throw new GauliaError("Lettre invalide.");
  if (game.guessed.includes(letter)) throw new GauliaError("Cette lettre a déjà été proposée.");

  game.guessed.push(letter);
  const hit = game.target.includes(letter);
  if (!hit) {
    game.missed.push(letter);
    game.errors++;
  }
  game.lastAction = `<@${userId}> propose ${letter} : ${hit ? "bien vu" : "raté"}.`;
  settle(gameId, game, userId);

  return renderHangman(game, gameId);
}

export function guessHangmanWord(gameId: string, userId: string, input: string): FunPayload {
  const game = requireHangmanPlayer(gameId, userId);
  const guess = normalizeWord(input);
  if (!/^[A-Z]+$/.test(guess)) {
    throw new GauliaError("Le mot ne doit contenir que des lettres.");
  }

  if (guess === game.target) {
    game.guessed = [...new Set([...game.guessed, ...game.target])];
  } else {
    game.errors++;
    game.lastAction = `<@${userId}> propose le mot ${guess} : raté.`;
  }
  settle(gameId, game, userId);

  return renderHangman(game, gameId);
}

export function forfeitHangman(gameId: string, userId: string): FunPayload {
  const game = hangmanGames.require(gameId);
  if (game.ownerId !== userId) {
    throw new GauliaError("Seul le membre qui a lancé la partie peut l'abandonner.");
  }
  game.outcome = { kind: "forfeit" };
  hangmanGames.finish(gameId);
  return renderHangman(game, gameId);
}

export function hangmanWordModal(gameId: string): ModalBuilder {
  return textInputModal(`fun:hangman-solve:${gameId}`, "Pendu", "Ton mot", { min: 2, max: 30 });
}
