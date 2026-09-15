export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "gaulia-theme";
/** Thème sombre par défaut : la préférence système n'est pas suivie, seul un choix explicite l'est. */
export const DEFAULT_THEME: Theme = "dark";

export function normalizeTheme(value: string | null | undefined): Theme | null {
  return value === "dark" || value === "light" ? value : null;
}
