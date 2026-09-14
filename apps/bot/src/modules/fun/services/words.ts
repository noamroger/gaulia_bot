import { HANGMAN_WORDS, WORDLE_ANSWERS, WORDLE_EXTRA_GUESSES } from "../data/frenchWords";

export const WORDLE_LENGTH = 5;

/** Majuscules sans accents : « Étagère » devient « ETAGERE ». */
export function normalizeWord(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .trim();
}

const isWordleWord = (word: string): boolean => /^[A-Z]{5}$/.test(word);

const wordleAnswers = [...new Set(WORDLE_ANSWERS.map(normalizeWord))].filter(isWordleWord);
const wordleGuesses = new Set(
  [...wordleAnswers, ...WORDLE_EXTRA_GUESSES.map(normalizeWord)].filter(isWordleWord),
);
const hangmanWords = HANGMAN_WORDS.filter((word) => /^[A-Z]{5,}$/.test(normalizeWord(word)));

function pick<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)]!;
}

export function randomWordleAnswer(): string {
  return pick(wordleAnswers);
}

export function isAcceptedWordleGuess(word: string): boolean {
  return wordleGuesses.has(word);
}

/** Mot du pendu en majuscules, accents conservés pour l'affichage. */
export function randomHangmanWord(): string {
  return pick(hangmanWords).toLocaleUpperCase("fr-FR");
}
