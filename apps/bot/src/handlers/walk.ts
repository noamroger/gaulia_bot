import { readdirSync, statSync } from "node:fs";
import { extname, join, sep } from "node:path";

/** Parcourt récursivement un dossier et retourne les fichiers .ts/.js (hors .d.ts). */
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

/** Filtre une liste de chemins pour ne garder que ceux situés dans un sous-dossier donné. */
export function filterBySubfolder(files: string[], subfolder: string): string[] {
  const marker = `${sep}${subfolder}${sep}`;
  return files.filter((file) => file.includes(marker));
}

/**
 * Charge l'export par défaut d'un module par chemin de fichier absolu. Utilise `require` plutôt
 * que `import()` dynamique : ce dernier traite toujours son argument comme une URL ESM, ce qui
 * casse sur Windows avec un chemin `E:\...` brut (ERR_UNSUPPORTED_ESM_URL_SCHEME) - `require`
 * gère nativement les chemins absolus de chaque plateforme.
 */
export function loadDefaultExport<T>(file: string): T | undefined {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const imported = require(file) as { default?: T };
  return imported.default;
}
