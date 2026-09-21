export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "gaulia-theme";
/** Dark by default: the system preference is ignored, only an explicit choice counts. */
export const DEFAULT_THEME: Theme = "dark";

export function normalizeTheme(value: string | null | undefined): Theme | null {
  return value === "dark" || value === "light" ? value : null;
}
