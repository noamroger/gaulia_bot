"use client";

import { useCallback, useSyncExternalStore } from "react";

import { DEFAULT_THEME, normalizeTheme, THEME_STORAGE_KEY, type Theme } from "./theme";

const listeners = new Set<() => void>();

/** Source de vérité : l'attribut posé par le script inline de layout.tsx, puis par `apply()`. */
function getSnapshot(): Theme {
  return normalizeTheme(document.documentElement.dataset.theme) ?? DEFAULT_THEME;
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Un autre onglet a changé le thème : on s'aligne sans réécrire le stockage.
  const onStorage = (event: StorageEvent): void => {
    if (event.key !== THEME_STORAGE_KEY) return;
    apply(normalizeTheme(event.newValue) ?? DEFAULT_THEME);
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Stockage indisponible (navigation privée, cookies bloqués) : le choix vaut pour l'onglet.
    }
    apply(next);
  }, []);

  return { theme, setTheme };
}
