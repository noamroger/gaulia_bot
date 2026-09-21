import type { FastifyInstance, FastifyRequest } from "fastify";

import enErrors from "../locales/en/errors";
import enMail from "../locales/en/mail";
import frErrors from "../locales/fr/errors";
import frMail from "../locales/fr/mail";
import { DEFAULT_LOCALE, matchAcceptLanguage, type AppLocale } from "./locales";
import { buildTranslator, type Dictionary, type Translator } from "./translate";

export type { AppLocale } from "./locales";
export type { Translator, TranslationVars } from "./translate";
export { DEFAULT_LOCALE, matchAcceptLanguage, matchLocale, SUPPORTED_LOCALES } from "./locales";

const dictionaries: Readonly<Record<AppLocale, Dictionary>> = {
  en: { errors: enErrors, mail: enMail },
  fr: { errors: frErrors, mail: frMail },
};

const translators = new Map<AppLocale, Translator>();

export function translatorFor(locale: AppLocale): Translator {
  let translator = translators.get(locale);
  if (!translator) {
    translator = buildTranslator(locale, dictionaries[locale], dictionaries[DEFAULT_LOCALE]);
    translators.set(locale, translator);
  }
  return translator;
}

/** Language of one request: what the caller asks for, then English. */
export function localeOf(request: FastifyRequest): AppLocale {
  return matchAcceptLanguage(request.headers["accept-language"]) ?? DEFAULT_LOCALE;
}

declare module "fastify" {
  interface FastifyRequest {
    /** Translator resolved from `Accept-Language`, so replies read in the caller's language. */
    t: Translator;
  }
}

/**
 * Hangs a translator on every request. The dashboard sends the reader's chosen language in
 * `Accept-Language`, so an error message comes back in the language the page is displayed in.
 */
export function registerI18n(app: FastifyInstance): void {
  // Declared with the English translator so the property exists on the prototype; the hook below
  // replaces it per request.
  app.decorateRequest("t", translatorFor(DEFAULT_LOCALE));
  app.addHook("onRequest", async (request) => {
    request.t = translatorFor(localeOf(request));
  });
}
