export { I18nProvider, useLocale, useTranslation } from "./I18nProvider";
export {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  isAppLocale,
  matchAcceptLanguage,
  matchLocale,
} from "./locales";
export type { AppLocale } from "./locales";
export { buildTranslator } from "./translate";
export type { Dictionary, Translator, TranslationVars } from "./translate";
