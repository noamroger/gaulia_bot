export { catalogModules, getCatalog, lookup } from "./catalog";
export type { TranslationModule, TranslationNode } from "./catalog";
export {
  localizeChoices,
  localizeContextMenu,
  localizeOption,
  localizeSlashCommand,
  localizationsOf,
} from "./localize";
export {
  AUTO_LOCALE,
  DEFAULT_LOCALE,
  DISCORD_LOCALES,
  SUPPORTED_LOCALES,
  isAppLocale,
  isStoredLocale,
  matchDiscordLocale,
  readStoredLocale,
} from "./locales";
export type { AppLocale, StoredLocale } from "./locales";
export {
  absentUserTranslator,
  describeUserLocale,
  forgetGuildLanguage,
  forgetUserLanguage,
  guildLanguageOverride,
  guildTranslatorFor,
  resilientTranslator,
  resolveGuildLocale,
  resolveUserLocale,
  translatorFor,
} from "./resolve";
export type { LocaleSource, ResolvedLocale } from "./resolve";
export { createTranslator, defaultTranslator } from "./translator";
export type { Translator, TranslationVars } from "./translator";
