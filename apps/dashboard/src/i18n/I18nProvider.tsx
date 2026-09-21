"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { dictionaries } from "./dictionary";
import { DEFAULT_LOCALE, type AppLocale } from "./locales";
import { buildTranslator, type Translator } from "./translate";

/** Only the locale crosses the server boundary; the strings are already in the client bundle. */
const LocaleContext = createContext<AppLocale>(DEFAULT_LOCALE);

export function I18nProvider({ locale, children }: { locale: AppLocale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): AppLocale {
  return useContext(LocaleContext);
}

export function useTranslation(): Translator {
  const locale = useLocale();
  return useMemo(
    () => buildTranslator(locale, dictionaries[locale], dictionaries[DEFAULT_LOCALE]),
    [locale],
  );
}
