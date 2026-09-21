import { existsSync } from "node:fs";
import { basename, extname, join } from "node:path";

import { loadDefaultExport, walk } from "../handlers/walk";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from "./locales";

/** A leaf is a string or a list of strings; anything else is a nested group of keys. */
export type TranslationNode =
  string | readonly string[] | { readonly [key: string]: TranslationNode };

export type TranslationModule = Readonly<Record<string, TranslationNode>>;

type LocaleCatalog = Record<string, TranslationModule>;

const LOCALES_DIR = join(__dirname, "..", "locales");

let catalog: Record<AppLocale, LocaleCatalog> | null = null;

/**
 * Reads `locales/<lang>/<module>.ts` for every shipped language. Loading is lazy and cached:
 * command files build their data at require time, before any client is up.
 */
function loadCatalog(): Record<AppLocale, LocaleCatalog> {
  const loaded = {} as Record<AppLocale, LocaleCatalog>;

  for (const locale of SUPPORTED_LOCALES) {
    const dir = join(LOCALES_DIR, locale);
    const modules: LocaleCatalog = {};

    if (existsSync(dir)) {
      for (const file of walk(dir)) {
        const strings = loadDefaultExport<TranslationModule>(file);
        if (strings) modules[basename(file, extname(file))] = strings;
      }
    }

    loaded[locale] = modules;
  }

  return loaded;
}

export function getCatalog(): Record<AppLocale, LocaleCatalog> {
  catalog ??= loadCatalog();
  return catalog;
}

/** Module names present for the default language, used by the completeness check. */
export function catalogModules(): string[] {
  return Object.keys(getCatalog()[DEFAULT_LOCALE]).sort();
}

/** Walks a dotted key ("moderation.ban.success") down one language's catalog. */
export function lookup(locale: AppLocale, key: string): TranslationNode | undefined {
  let node: TranslationNode | undefined = getCatalog()[locale];

  for (const segment of key.split(".")) {
    if (typeof node !== "object" || node === null || Array.isArray(node)) return undefined;
    node = (node as Record<string, TranslationNode>)[segment];
    if (node === undefined) return undefined;
  }

  return node;
}
