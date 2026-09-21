/**
 * Shared game content is read by the bot, the API and (through the API) the dashboard, each of
 * which serves a reader whose language is known only at request time. Text in this folder is
 * therefore stored in both languages and picked at the last moment.
 */

export type LocalizedText = Readonly<Record<"en" | "fr", string>>;

/** Reads a bilingual field; anything that is not French falls back to English. */
export function localized(text: LocalizedText, locale: string): string {
  return locale.startsWith("fr") ? text.fr : text.en;
}
