"use client";

import { useEffect, useState } from "react";

import { StatTile } from "@/components/stats/StatTile";
import { api } from "@/lib/api";
import { formatCompact } from "@/lib/format";
import type { PublicStats } from "@/lib/types";

const REFRESH_INTERVAL_MS = 60_000;

export function LiveStats() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const data = await api.get<PublicStats>("/stats");
        if (!cancelled) {
          setStats(data);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void load();
    const timer = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const display = (value: number | undefined): string =>
    value === undefined ? "—" : formatCompact(value);

  return (
    <section className="landing-live" aria-label="Statistiques en direct">
      <div className="landing-stats">
        <StatTile label="Serveurs" value={display(stats?.guildCount)} />
        <StatTile label="Membres" value={display(stats?.memberCount)} />
        <StatTile
          label="Commandes utilisées"
          value={display(stats?.commandsLast30Days)}
          hint="sur les 30 derniers jours"
        />
      </div>
      <p className="landing-status" role="status">
        {stats ? (
          <>
            <span
              className={`status-dot ${stats.online ? "online" : "offline"}`}
              aria-hidden="true"
            />
            {stats.online ? "Gaulia est en ligne" : "Gaulia est hors ligne"} · chiffres actualisés
            chaque minute
          </>
        ) : failed ? (
          "Statistiques indisponibles pour le moment."
        ) : (
          "Chargement des statistiques…"
        )}
      </p>
    </section>
  );
}
