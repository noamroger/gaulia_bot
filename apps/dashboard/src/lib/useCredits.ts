"use client";

import { useEffect, useState } from "react";

import { api } from "./api";
import type { CreditsOverview } from "./types";

/**
 * Credit balance shared by every component that displays it. One network call serves them all:
 * the result is cached at module level and broadcast to the subscribers.
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

/** Forces a reload, for instance after credits have been redeemed for premium. */
export function refreshCredits(): void {
  void load().catch(() => undefined);
}

/** Updates the known balance without a network call, from a route that already returns it. */
export function setCreditBalance(balance: number): void {
  if (cache) publish({ ...cache, balance });
}

export interface UseCreditsResult {
  credits: CreditsOverview | null;
  /** True until the first load has finished, successfully or not. */
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
