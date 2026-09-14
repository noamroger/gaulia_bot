"use client";

import { useEffect, useState } from "react";

import { api } from "./api";
import type { GuildResources } from "./types";

/** Salons texte et rôles du serveur, pour les sélecteurs des pages de paramètres. */
export function useGuildResources(guildId: string): {
  resources: GuildResources | null;
  failed: boolean;
} {
  const [resources, setResources] = useState<GuildResources | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<GuildResources>(`/guilds/${guildId}/discord`)
      .then((value) => {
        if (!cancelled) setResources(value);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  return { resources, failed };
}
