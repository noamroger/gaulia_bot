import type { AppLocale } from "../../../../i18n";
import english from "./en";
import french from "./fr";

/** Game vocabulary of one language. */
export interface WordList {
  hangman: readonly string[];
  wordleAnswers: readonly string[];
  wordleExtraGuesses: readonly string[];
}

export const WORD_LISTS: Record<AppLocale, WordList> = { en: english, fr: french };
