/** Languages the dashboard ships translations for. */
export const SUPPORTED_LOCALES = ["en", "fr"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** Used whenever the visitor's language cannot be determined. */
export const DEFAULT_LOCALE: AppLocale = "en";

/** Cookie holding an explicit choice, read on the server so the first render is already right. */
export const LOCALE_COOKIE = "gaulia-lang";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Label of each language, written in that language. */
export const LOCALE_LABELS: Readonly<Record<AppLocale, string>> = {
  en: "English",
  fr: "Français",
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Matches a language tag ("fr", "en-GB", "fr-CA") onto a shipped language by primary subtag. */
export function matchLocale(value: string | null | undefined): AppLocale | null {
  if (!value) return null;
  const primary = value.split("-")[0]?.toLowerCase();
  return SUPPORTED_LOCALES.find((locale) => locale === primary) ?? null;
}

/**
 * Picks the best shipped language out of an `Accept-Language` header, honouring quality values so
 * a visitor asking for "fr;q=0.9, en;q=0.8" gets French.
 */
export function matchAcceptLanguage(header: string | null | undefined): AppLocale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...parameters] = part.trim().split(";");
      const quality = parameters
        .map((parameter) => /^q=([\d.]+)$/.exec(parameter.trim())?.[1])
        .find((value) => value !== undefined);
      return { tag: tag ?? "", quality: quality === undefined ? 1 : Number(quality) };
    })
    .filter((entry) => entry.tag && Number.isFinite(entry.quality) && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const entry of ranked) {
    const matched = matchLocale(entry.tag);
    if (matched) return matched;
  }

  return null;
}
