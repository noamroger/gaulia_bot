import { cookies, headers } from "next/headers";

import { dictionaries } from "./dictionary";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  matchAcceptLanguage,
  matchLocale,
  type AppLocale,
} from "./locales";
import { buildTranslator, type Translator } from "./translate";

/**
 * Language of the current request: the visitor's explicit choice first, then what their browser
 * asks for, then English. Reading it on the server means the first paint is already translated.
 */
export async function getLocale(): Promise<AppLocale> {
  const chosen = matchLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  if (chosen) return chosen;

  const accepted = matchAcceptLanguage((await headers()).get("accept-language"));
  return accepted ?? DEFAULT_LOCALE;
}

/** Translator for a server component or for `generateMetadata`. */
export async function getTranslator(): Promise<Translator> {
  return translatorFor(await getLocale());
}

export function translatorFor(locale: AppLocale): Translator {
  return buildTranslator(locale, dictionaries[locale], dictionaries[DEFAULT_LOCALE]);
}
