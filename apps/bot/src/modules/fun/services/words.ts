import type { AppLocale } from "../../../i18n";
import { WORD_LISTS } from "../data/words";

export const WORDLE_LENGTH = 5;

/** Uppercase without accents: "Etagere" and "Étagère" compare equal. */
export function normalizeWord(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .trim();
}

interface PreparedWords {
  wordleAnswers: string[];
  wordleGuesses: Set<string>;
  hangman: string[];
}

const isWordleWord = (word: string): boolean => /^[A-Z]{5}$/.test(word);

function prepare(locale: AppLocale): PreparedWords {
  const list = WORD_LISTS[locale];
  const wordleAnswers = [...new Set(list.wordleAnswers.map(normalizeWord))].filter(isWordleWord);

  return {
    wordleAnswers,
    wordleGuesses: new Set(
      [...wordleAnswers, ...list.wordleExtraGuesses.map(normalizeWord)].filter(isWordleWord),
    ),
    hangman: list.hangman.filter((word) => /^[A-Z]{5,}$/.test(normalizeWord(word))),
  };
}

const prepared = new Map<AppLocale, PreparedWords>();

function wordsFor(locale: AppLocale): PreparedWords {
  let entry = prepared.get(locale);
  if (!entry) {
    entry = prepare(locale);
    prepared.set(locale, entry);
  }
  return entry;
}

function pick<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)]!;
}

export function randomWordleAnswer(locale: AppLocale): string {
  return pick(wordsFor(locale).wordleAnswers);
}

export function isAcceptedWordleGuess(word: string, locale: AppLocale): boolean {
  return wordsFor(locale).wordleGuesses.has(word);
}

/** Hangman word in uppercase, accents kept for display. */
export function randomHangmanWord(locale: AppLocale): string {
  return pick(wordsFor(locale).hangman).toLocaleUpperCase(locale);
}
