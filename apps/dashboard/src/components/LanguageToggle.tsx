"use client";

import { useRouter } from "next/navigation";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  useLocale,
  useTranslation,
  type AppLocale,
} from "@/i18n";

function GlobeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}

/** Next language in the list, so the button always offers something other than the current one. */
function nextLocale(current: AppLocale): AppLocale {
  const index = SUPPORTED_LOCALES.indexOf(current);
  return SUPPORTED_LOCALES[(index + 1) % SUPPORTED_LOCALES.length]!;
}

/**
 * Language switch.
 * - `icon`: round button of the navigation bars;
 * - `menu`: entry of the mobile dropdown, with a label.
 *
 * The choice is kept in a cookie rather than in local storage, so the server already renders the
 * right language instead of the page switching over once JavaScript runs.
 */
export function LanguageToggle({ variant = "icon" }: { variant?: "icon" | "menu" }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslation();
  const target = nextLocale(locale);
  const label = t("nav.language.switchTo", { language: LOCALE_LABELS[target] });

  function switchTo(next: AppLocale): void {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure}`;
    router.refresh();
  }

  return (
    <button
      type="button"
      className={variant === "menu" ? "menu-item language-menu-item" : "language-toggle"}
      onClick={() => switchTo(target)}
      aria-label={variant === "menu" ? undefined : label}
      title={variant === "menu" ? undefined : label}
      lang={target}
    >
      <GlobeIcon />
      {variant === "menu" ? (
        <span>{LOCALE_LABELS[target]}</span>
      ) : (
        <span aria-hidden="true">{locale.toUpperCase()}</span>
      )}
    </button>
  );
}
