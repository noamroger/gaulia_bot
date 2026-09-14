"use client";

import { useEffect, useState } from "react";

import { api } from "./api";
import type { CreditsOverview } from "./types";

/**
 * Solde de crédits partagé entre les composants qui l'affichent (badge de la barre de navigation,
 * carte de la page « Mes serveurs »). Un seul appel réseau est fait pour tous : le résultat est
 * mis en cache au niveau du module et rediffusé aux abonnés.
 */
let cache: CreditsOverview | null = null;
let inFlight: Promise<CreditsOverview> | null = null;
const subscribers = new Set<(credits: CreditsOverview | null) => void>();

function publish(credits: CreditsOverview | null): void {
  cache = credits;
  for (const notify of subscribers) notify(credits);
}

async function load(): Promise<CreditsOverview> {
  inFlight ??= api
    .get<CreditsOverview>("/me/credits")
    .then((credits) => {
      publish(credits);
      return credits;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Force un rechargement, par exemple après un échange de crédits contre du premium. */
export function refreshCredits(): void {
  void load().catch(() => undefined);
}

/** Met à jour le solde connu sans appel réseau (réponse d'une route qui le renvoie déjà). */
export function setCreditBalance(balance: number): void {
  if (cache) publish({ ...cache, balance });
}

export interface UseCreditsResult {
  credits: CreditsOverview | null;
  /** Vrai tant que le premier chargement n'a pas abouti (ou a échoué). */
  loading: boolean;
}

export function useCredits(): UseCreditsResult {
  const [credits, setCredits] = useState<CreditsOverview | null>(cache);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    subscribers.add(setCredits);

    let cancelled = false;
    if (cache === null) {
      load()
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
      subscribers.delete(setCredits);
    };
  }, []);

  return { credits, loading };
}
