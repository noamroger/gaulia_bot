import { DEFAULT_LOCALE, type AppLocale } from "@/i18n/locales";

/** Formatters are built once per locale: creating an Intl instance on every render is costly. */
const integerFormats = new Map<AppLocale, Intl.NumberFormat>();
const compactFormats = new Map<AppLocale, Intl.NumberFormat>();
const relativeFormats = new Map<AppLocale, Intl.RelativeTimeFormat>();

function integerFormat(locale: AppLocale): Intl.NumberFormat {
  let format = integerFormats.get(locale);
  if (!format) {
    format = new Intl.NumberFormat(locale);
    integerFormats.set(locale, format);
  }
  return format;
}

function compactFormat(locale: AppLocale): Intl.NumberFormat {
  let format = compactFormats.get(locale);
  if (!format) {
    format = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
    compactFormats.set(locale, format);
  }
  return format;
}

function relativeFormat(locale: AppLocale): Intl.RelativeTimeFormat {
  let format = relativeFormats.get(locale);
  if (!format) {
    format = new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "short" });
    relativeFormats.set(locale, format);
  }
  return format;
}

function unit(value: number, name: "day" | "hour" | "minute", locale: AppLocale): string {
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: name,
    unitDisplay: "short",
  }).format(value);
}

export function formatNumber(value: number, locale: AppLocale = DEFAULT_LOCALE): string {
  return integerFormat(locale).format(value);
}

/** Readable integer up to 9,999, compact beyond it (12.9K, 4.2M). */
export function formatCompact(value: number, locale: AppLocale = DEFAULT_LOCALE): string {
  return value < 10_000 ? integerFormat(locale).format(value) : compactFormat(locale).format(value);
}

export function formatDay(isoDate: string, locale: AppLocale = DEFAULT_LOCALE): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Short date of an ISO instant, in the browser's timezone ("14 Sep", "14 sept."). */
export function formatShortDate(iso: string, locale: AppLocale = DEFAULT_LOCALE): string {
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

/** Date and time of an ISO instant, in the browser's timezone. */
export function formatDateTime(iso: string, locale: AppLocale = DEFAULT_LOCALE): string {
  return new Date(iso).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatUptime(
  sinceIso: string,
  now: number,
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  const seconds = Math.max(0, Math.floor((now - new Date(sinceIso).getTime()) / 1000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  if (days > 0) return `${unit(days, "day", locale)} ${unit(hours, "hour", locale)}`;
  if (hours > 0) return `${unit(hours, "hour", locale)} ${unit(minutes, "minute", locale)}`;
  return unit(minutes, "minute", locale);
}

/** Intl writes "5 sec. ago" or "il y a 5 s" on its own, so no wording lives here. */
export function formatRelative(
  sinceIso: string,
  now: number,
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  const seconds = Math.max(0, Math.round((now - new Date(sinceIso).getTime()) / 1000));
  if (seconds < 60) return relativeFormat(locale).format(-seconds, "second");

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return relativeFormat(locale).format(-minutes, "minute");

  return relativeFormat(locale).format(-Math.round(minutes / 60), "hour");
}
