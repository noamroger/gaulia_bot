import { logger } from "../client/logger";
import { lookup, type TranslationNode } from "./catalog";
import { DEFAULT_LOCALE, type AppLocale } from "./locales";

export type TranslationVars = Record<string, string | number>;

export interface Translator {
  /** Reads a string key, filling `{placeholders}` from `vars`. */
  (key: string, vars?: TranslationVars): string;
  readonly locale: AppLocale;
  /** Reads a key holding a list of strings, such as the usage examples of a command. */
  list(key: string, vars?: TranslationVars): string[];
  /** True when the key exists in this language or in English. */
  has(key: string): boolean;
}

const PLACEHOLDER = /\{(\w+)\}/g;

function interpolate(text: string, vars: TranslationVars | undefined): string {
  if (!vars) return text;
  return text.replace(PLACEHOLDER, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Picks the plural branch of a node shaped `{ zero?, one, other }` from `vars.count`. English and
 * French agree on the boundary: only exactly one takes the singular ("1 warn", "1 avertissement").
 */
function selectPlural(node: TranslationNode, vars: TranslationVars | undefined): TranslationNode {
  if (typeof node !== "object" || node === null || Array.isArray(node)) return node;
  if (vars?.count === undefined || !("other" in node)) return node;

  const branches = node as Record<string, TranslationNode>;
  const count = Number(vars.count);

  if (count === 0 && branches.zero !== undefined) return branches.zero;
  if (count === 1 && branches.one !== undefined) return branches.one;
  return branches.other ?? node;
}

/** Reads a key in `locale`, then in English, and warns once the key is missing from both. */
function resolveNode(
  locale: AppLocale,
  key: string,
  vars: TranslationVars | undefined,
): TranslationNode | undefined {
  const direct = lookup(locale, key);
  if (direct !== undefined) return selectPlural(direct, vars);

  if (locale !== DEFAULT_LOCALE) {
    const fallback = lookup(DEFAULT_LOCALE, key);
    if (fallback !== undefined) {
      logger.warn({ key, locale }, "Missing translation, falling back to English");
      return selectPlural(fallback, vars);
    }
  }

  logger.warn({ key, locale }, "Unknown translation key");
  return undefined;
}

const cache = new Map<AppLocale, Translator>();

export function createTranslator(locale: AppLocale): Translator {
  const cached = cache.get(locale);
  if (cached) return cached;

  const translate = (key: string, vars?: TranslationVars): string => {
    const node = resolveNode(locale, key, vars);
    if (typeof node === "string") return interpolate(node, vars);
    if (Array.isArray(node)) return node.map((line) => interpolate(line, vars)).join("\n");
    return key;
  };

  const translator = Object.assign(translate, {
    locale,
    list(key: string, vars?: TranslationVars): string[] {
      const node = resolveNode(locale, key, vars);
      if (Array.isArray(node)) return node.map((line) => interpolate(line, vars));
      if (typeof node === "string") return [interpolate(node, vars)];
      return [];
    },
    has(key: string): boolean {
      return lookup(locale, key) !== undefined || lookup(DEFAULT_LOCALE, key) !== undefined;
    },
  }) as Translator;

  cache.set(locale, translator);
  return translator;
}

/** English translator, for logs and anything sent outside an interaction. */
export const defaultTranslator = (): Translator => createTranslator(DEFAULT_LOCALE);
