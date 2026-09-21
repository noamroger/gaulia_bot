/** Languages the API answers in. */
export const SUPPORTED_LOCALES = ["en", "fr"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** Used when the request says nothing about its language. */
export const DEFAULT_LOCALE: AppLocale = "en";

export function matchLocale(value: string | null | undefined): AppLocale | null {
  if (!value) return null;
  const primary = value.split("-")[0]?.toLowerCase();
  return SUPPORTED_LOCALES.find((locale) => locale === primary) ?? null;
}

/**
 * Picks the best shipped language out of an `Accept-Language` header, honouring quality values so
 * a client asking for "fr;q=0.9, en;q=0.8" gets French. The dashboard sends the reader's choice
 * there, so the API answers in the language the page is displayed in.
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
