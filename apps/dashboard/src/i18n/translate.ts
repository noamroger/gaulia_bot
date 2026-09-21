export type TranslationNode =
  string | readonly string[] | { readonly [key: string]: TranslationNode };

export type Dictionary = Readonly<Record<string, TranslationNode>>;

export type TranslationVars = Record<string, string | number>;

export interface Translator {
  /** Reads a string key, filling `{placeholders}` from `vars`. */
  (key: string, vars?: TranslationVars): string;
  readonly locale: string;
  /** Reads a key holding a list of strings, such as the bullet points of a section. */
  list(key: string, vars?: TranslationVars): string[];
  /** True when the key exists, for wording that is optional rather than missing. */
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

function walk(dictionary: Dictionary, key: string): TranslationNode | undefined {
  let node: TranslationNode | undefined = dictionary;

  for (const segment of key.split(".")) {
    if (typeof node !== "object" || node === null || Array.isArray(node)) return undefined;
    node = (node as Record<string, TranslationNode>)[segment];
    if (node === undefined) return undefined;
  }

  return node;
}

/** English and French agree here: only exactly one takes the singular. */
function selectPlural(node: TranslationNode, vars: TranslationVars | undefined): TranslationNode {
  if (typeof node !== "object" || node === null || Array.isArray(node)) return node;
  if (vars?.count === undefined || !("other" in node)) return node;

  const branches = node as Record<string, TranslationNode>;
  const count = Number(vars.count);

  if (count === 0 && branches.zero !== undefined) return branches.zero;
  if (count === 1 && branches.one !== undefined) return branches.one;
  return branches.other ?? node;
}

/**
 * Builds a translator over one language, falling back to `fallback` for any key that language is
 * missing, then to the key itself so a gap shows up rather than rendering an empty page.
 */
export function buildTranslator(
  locale: string,
  dictionary: Dictionary,
  fallback: Dictionary,
): Translator {
  const resolve = (key: string, vars: TranslationVars | undefined): TranslationNode | undefined => {
    const node = walk(dictionary, key) ?? walk(fallback, key);
    return node === undefined ? undefined : selectPlural(node, vars);
  };

  const translate = (key: string, vars?: TranslationVars): string => {
    const node = resolve(key, vars);
    if (typeof node === "string") return interpolate(node, vars);
    if (Array.isArray(node)) return node.map((line) => interpolate(line, vars)).join("\n");
    return key;
  };

  return Object.assign(translate, {
    locale,
    list(key: string, vars?: TranslationVars): string[] {
      const node = resolve(key, vars);
      if (Array.isArray(node)) return node.map((line) => interpolate(line, vars));
      if (typeof node === "string") return [interpolate(node, vars)];
      return [];
    },
    has(key: string): boolean {
      return resolve(key, undefined) !== undefined;
    },
  }) as Translator;
}
