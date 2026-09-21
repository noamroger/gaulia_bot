import { Locale } from "discord.js";

/** Languages the bot ships translations for. */
export const SUPPORTED_LOCALES = ["en", "fr"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** Used whenever no language can be determined for a user or a guild. */
export const DEFAULT_LOCALE: AppLocale = "en";

/** Stored value meaning "follow the Discord locale" instead of forcing a language. */
export const AUTO_LOCALE = "auto";

/** What `Guild.language` and `UserPreference.language` accept. */
export type StoredLocale = AppLocale | typeof AUTO_LOCALE;

/** Discord locales covered by each shipped language, for native localization payloads. */
export const DISCORD_LOCALES: Readonly<Record<AppLocale, readonly Locale[]>> = {
  en: [Locale.EnglishUS, Locale.EnglishGB],
  fr: [Locale.French],
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function isStoredLocale(value: unknown): value is StoredLocale {
  return value === AUTO_LOCALE || isAppLocale(value);
}

/**
 * Maps a Discord locale onto a shipped language by primary subtag, so "en-US" and "en-GB" both
 * land on English. Returns null when nothing matches, which is what triggers the English fallback.
 */
export function matchDiscordLocale(value: string | null | undefined): AppLocale | null {
  if (!value) return null;
  const primary = value.split("-")[0]?.toLowerCase();
  return SUPPORTED_LOCALES.find((locale) => locale === primary) ?? null;
}

/** Reads a stored override, ignoring "auto" and any value left by an older schema. */
export function readStoredLocale(value: string | null | undefined): AppLocale | null {
  return isAppLocale(value) ? value : null;
}
