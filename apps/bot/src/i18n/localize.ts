import type { APIApplicationCommandOptionChoice, Locale } from "discord.js";

import { lookup } from "./catalog";
import { DEFAULT_LOCALE, DISCORD_LOCALES, SUPPORTED_LOCALES, type AppLocale } from "./locales";

type LocalizationMap = Partial<Record<Locale, string>>;

interface NameLocalizable {
  setName(name: string): unknown;
  setNameLocalizations(localizations: LocalizationMap | null): unknown;
}

interface DescriptionLocalizable extends NameLocalizable {
  setDescription(description: string): unknown;
  setDescriptionLocalizations(localizations: LocalizationMap | null): unknown;
}

function readField(locale: AppLocale, key: string, field: string): string | undefined {
  const value = lookup(locale, `${key}.${field}`);
  return typeof value === "string" ? value : undefined;
}

/** Command and option names must be lowercase; the catalog is free to be written naturally. */
function normalizeName(value: string): string {
  return value.toLowerCase();
}

/**
 * Builds the `name_localizations` / `description_localizations` payload Discord expects, so a
 * French client shows `/aventure` where an English one shows `/adventure`, with no work at runtime.
 */
export function localizationsOf(
  key: string,
  field: "name" | "description",
  { lowercase = false }: { lowercase?: boolean } = {},
): LocalizationMap {
  const localizations: LocalizationMap = {};

  for (const locale of SUPPORTED_LOCALES) {
    const value = readField(locale, key, field);
    if (!value) continue;
    for (const discordLocale of DISCORD_LOCALES[locale]) {
      localizations[discordLocale] = lowercase ? normalizeName(value) : value;
    }
  }

  return localizations;
}

function applyName<T extends NameLocalizable>(builder: T, key: string): T {
  const name = readField(DEFAULT_LOCALE, key, "name");
  if (name) {
    builder.setName(normalizeName(name));
    builder.setNameLocalizations(localizationsOf(key, "name", { lowercase: true }));
  }
  return builder;
}

function applyDescription<T extends DescriptionLocalizable>(builder: T, key: string): T {
  const description = readField(DEFAULT_LOCALE, key, "description");
  if (description) {
    builder.setDescription(description);
    builder.setDescriptionLocalizations(localizationsOf(key, "description"));
  }
  return builder;
}

/** Names and describes a slash command from `<module>.commands.<command>` in the catalog. */
export function localizeSlashCommand<T extends DescriptionLocalizable>(builder: T, key: string): T {
  return applyDescription(applyName(builder, key), key);
}

/** Same for an option, whose key is `<command key>.options.<option>`. */
export function localizeOption<T extends DescriptionLocalizable>(option: T, key: string): T {
  return applyDescription(applyName(option, key), key);
}

/** Context menu entries carry a name only, and keep their capitalisation. */
export function localizeContextMenu<T extends NameLocalizable>(builder: T, key: string): T {
  const name = readField(DEFAULT_LOCALE, key, "name");
  if (name) {
    builder.setName(name);
    builder.setNameLocalizations(localizationsOf(key, "name"));
  }
  return builder;
}

/** Localizations of a plain string leaf, such as one choice label. */
function leafLocalizations(key: string): LocalizationMap {
  const localizations: LocalizationMap = {};

  for (const locale of SUPPORTED_LOCALES) {
    const value = lookup(locale, key);
    if (typeof value !== "string") continue;
    for (const discordLocale of DISCORD_LOCALES[locale]) {
      localizations[discordLocale] = value;
    }
  }

  return localizations;
}

/**
 * Turns `<option key>.choices` (a value to label map in each language) into localized choices, so
 * the picker reads in the member's own language while the value the code receives stays stable.
 */
export function localizeChoices<T extends string | number>(
  key: string,
  values: readonly T[],
): APIApplicationCommandOptionChoice<T>[] {
  return values.map((value) => {
    const choiceKey = `${key}.choices.${value}`;
    const label = lookup(DEFAULT_LOCALE, choiceKey);
    return {
      name: typeof label === "string" ? label : String(value),
      name_localizations: leafLocalizations(choiceKey),
      value,
    };
  });
}
