import { readdirSync, statSync } from "node:fs";
import { extname, join, sep } from "node:path";

/** Walks a folder recursively and returns its .ts/.js files, skipping .d.ts. */
export function walk(dir: string): string[] {
  const results: string[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      results.push(...walk(fullPath));
      continue;
    }

    const ext = extname(fullPath);
    if ((ext === ".ts" || ext === ".js") && !fullPath.endsWith(".d.ts")) {
      results.push(fullPath);
    }
  }

  return results;
}

/** Keeps only the paths sitting inside a given subfolder. */
export function filterBySubfolder(files: string[], subfolder: string): string[] {
  const marker = `${sep}${subfolder}${sep}`;
  return files.filter((file) => file.includes(marker));
}

/**
 * Loads a module's default export from an absolute path. Uses `require` rather than a dynamic
 * `import()`: the latter always treats its argument as an ESM URL, which breaks on Windows with a
 * raw `E:\...` path (ERR_UNSUPPORTED_ESM_URL_SCHEME), while `require` handles absolute paths on
 * every platform.
 */
export function loadDefaultExport<T>(file: string): T | undefined {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const imported = require(file) as { default?: T };
  return imported.default;
}
