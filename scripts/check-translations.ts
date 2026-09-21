/**
 * Fails on the two translation gaps the compiler cannot see:
 * - a key typed by hand in a `t("...")` call that no English catalogue defines;
 * - a `{placeholder}` present in one language and missing from another, which would render the
 *   brace literally to the reader.
 *
 * TypeScript already guarantees that the French files mirror the English ones key for key. Keys
 * built at runtime (`t(`prefix.${value}`)` where the value is not a local constant) cannot be
 * resolved statically and are reported as skipped rather than as failures.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

type Node = string | readonly string[] | { readonly [key: string]: Node };

const ROOT = join(__dirname, "..");

interface App {
  name: string;
  /** Source tree scanned for key usages. */
  sources: string;
  /** Locale tree; each `<locale>/<module>.ts` becomes the `<module>` namespace. */
  locales: string;
}

const APPS: App[] = [
  { name: "bot", sources: "apps/bot/src", locales: "apps/bot/src/locales" },
  { name: "dashboard", sources: "apps/dashboard/src", locales: "apps/dashboard/src/locales" },
  { name: "api", sources: "apps/api/src", locales: "apps/api/src/locales" },
];

const DEFAULT_LOCALE = "en";
const LOCALES = ["en", "fr"];

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...walk(fullPath));
      continue;
    }
    if ([".ts", ".tsx"].includes(extname(fullPath)) && !fullPath.endsWith(".d.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

function flatten(node: Node, prefix: string, into: Set<string>): void {
  if (typeof node === "string" || Array.isArray(node)) {
    into.add(prefix);
    return;
  }
  for (const [key, child] of Object.entries(node as Record<string, Node>)) {
    flatten(child, prefix ? `${prefix}.${key}` : key, into);
    // A plural node is a leaf for callers, who read it through `{ count }`.
    if (key === "other" && prefix) into.add(prefix);
  }
}

function loadKeys(app: App): Set<string> {
  const dir = join(ROOT, app.locales, DEFAULT_LOCALE);
  const keys = new Set<string>();

  for (const file of walk(dir)) {
    const moduleName = file.slice(dir.length + 1).replace(/\.tsx?$/, "");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require(file) as { default?: Node };
    if (loaded.default) flatten(loaded.default, moduleName, keys);
  }

  return keys;
}

/** Every leaf string of one language, by dotted key; a plural or a list contributes each branch. */
function collectStrings(node: Node, prefix: string, into: Map<string, string[]>): void {
  if (typeof node === "string") {
    into.set(prefix, [...(into.get(prefix) ?? []), node]);
    return;
  }
  if (Array.isArray(node)) {
    into.set(prefix, [...(into.get(prefix) ?? []), ...node]);
    return;
  }
  for (const [key, child] of Object.entries(node as Record<string, Node>)) {
    collectStrings(child, prefix ? `${prefix}.${key}` : key, into);
  }
}

function loadStrings(app: App, locale: string): Map<string, string[]> {
  const dir = join(ROOT, app.locales, locale);
  const strings = new Map<string, string[]>();

  for (const file of walk(dir)) {
    const moduleName = file.slice(dir.length + 1).replace(/\.tsx?$/, "");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require(file) as { default?: Node };
    if (loaded.default) collectStrings(loaded.default, moduleName, strings);
  }

  return strings;
}

function placeholdersOf(lines: string[]): Set<string> {
  const names = new Set<string>();
  for (const line of lines) {
    for (const match of line.matchAll(/\{(\w+)\}/g)) names.add(match[1]!);
  }
  return names;
}

/**
 * A plural branch is chosen by `count`, which the sentence itself rarely spells out, so `count`
 * never has to appear on both sides.
 */
function comparePlaceholders(app: App): string[] {
  const reference = loadStrings(app, DEFAULT_LOCALE);
  const problems: string[] = [];

  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    const other = loadStrings(app, locale);

    for (const [key, lines] of reference) {
      const expected = placeholdersOf(lines);
      const actual = placeholdersOf(other.get(key) ?? []);
      expected.delete("count");
      actual.delete("count");

      const missing = [...expected].filter((name) => !actual.has(name));
      const extra = [...actual].filter((name) => !expected.has(name));
      if (missing.length > 0)
        problems.push(`${locale} ${key} is missing {${missing.join("}, {")}}`);
      if (extra.length > 0)
        problems.push(`${locale} ${key} has an unknown {${extra.join("}, {")}}`);
    }
  }

  return problems;
}

/** Local `const NAME = "..."` and `const NAME = `${OTHER}.rest`` bindings, resolved one at a time. */
function localConstants(source: string): Map<string, string> {
  const constants = new Map<string, string>();

  for (const match of source.matchAll(/const (\w+)\s*=\s*"([^"]+)"/g)) {
    constants.set(match[1]!, match[2]!);
  }

  for (const match of source.matchAll(/const (\w+)\s*=\s*`([^`]+)`/g)) {
    const resolved = resolve(match[2]!, constants);
    if (resolved) constants.set(match[1]!, resolved);
  }

  return constants;
}

/** Replaces `${NAME}` by its literal value, or returns null when something stays dynamic. */
function resolve(raw: string, constants: Map<string, string>): string | null {
  const resolved = raw.replace(
    /\$\{(\w+)\}/g,
    (match, name: string) => constants.get(name) ?? match,
  );
  return resolved.includes("${") ? null : resolved;
}

interface Usage {
  key: string;
  file: string;
}

function collectUsages(app: App): { used: Usage[]; skipped: number } {
  const used: Usage[] = [];
  let skipped = 0;

  for (const file of walk(join(ROOT, app.sources))) {
    if (file.includes(join(app.locales, ""))) continue;

    const source = readFileSync(file, "utf8");
    const constants = localConstants(source);
    const where = relative(ROOT, file);

    const add = (raw: string | null): void => {
      if (raw === null) {
        skipped += 1;
        return;
      }
      used.push({ key: raw, file: where });
    };

    // t("key") and request.t("key")
    for (const match of source.matchAll(/\bt\(\s*"([\w.]+)"/g)) add(match[1]!);
    // t(`${KEY}.suffix`)
    for (const match of source.matchAll(/\bt\(\s*`([^`]+)`/g)) add(resolve(match[1]!, constants));
    // t.list("key") and t.list(`...`)
    for (const match of source.matchAll(/\bt\.list\(\s*"([\w.]+)"/g)) add(match[1]!);
    for (const match of source.matchAll(/\bt\.list\(\s*`([^`]+)`/g)) {
      add(resolve(match[1]!, constants));
    }

    // A command's i18nKey must carry its Discord metadata and its `/help` entry. A context menu
    // has no description: Discord does not store one, and `/help` writes its own summary.
    const isContextMenu = /type:\s*"(?:user|message)ContextMenu"/.test(source);
    const metadataSuffixes = isContextMenu
      ? ["name", "help.details", "help.examples"]
      : ["name", "description", "help.details", "help.examples"];
    for (const match of source.matchAll(/i18nKey:\s*(?:"([\w.]+)"|(\w+))/g)) {
      const base = match[1] ?? constants.get(match[2]!);
      if (!base) {
        skipped += 1;
        continue;
      }
      for (const suffix of metadataSuffixes) {
        used.push({ key: `${base}.${suffix}`, file: where });
      }
    }

    // localizeSlashCommand / localizeOption / localizeContextMenu need a name.
    for (const match of source.matchAll(
      /localize(?:SlashCommand|Option|ContextMenu)\([^,]+,\s*(?:"([\w.]+)"|`([^`]+)`|(\w+))\s*\)/g,
    )) {
      const base = match[1] ?? (match[2] ? resolve(match[2], constants) : constants.get(match[3]!));
      if (!base) {
        skipped += 1;
        continue;
      }
      used.push({ key: `${base}.name`, file: where });
    }
  }

  return { used, skipped };
}

let failed = false;

for (const app of APPS) {
  const known = loadKeys(app);
  const { used, skipped } = collectUsages(app);

  const missing = new Map<string, string>();
  for (const usage of used) {
    if (!known.has(usage.key)) missing.set(usage.key, usage.file);
  }

  const mismatched = comparePlaceholders(app);
  const checked = used.length;

  if (missing.size === 0 && mismatched.length === 0) {
    console.log(`${app.name}: ${known.size} keys, ${checked} usages checked, ${skipped} dynamic`);
    continue;
  }

  failed = true;
  if (missing.size > 0) {
    console.error(`${app.name}: ${missing.size} missing key(s)`);
    for (const [key, file] of [...missing].sort()) console.error(`  ${key}  (${file})`);
  }
  if (mismatched.length > 0) {
    console.error(`${app.name}: ${mismatched.length} placeholder mismatch(es)`);
    for (const problem of mismatched.sort()) console.error(`  ${problem}`);
  }
}

if (failed) process.exit(1);
