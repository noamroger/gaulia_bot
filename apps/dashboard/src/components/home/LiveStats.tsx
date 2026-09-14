"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { formatCompact } from "@/lib/format";
import type { PublicStats } from "@/lib/types";

const REFRESH_INTERVAL_MS = 60_000;

const ITEMS: { key: "guildCount" | "memberCount" | "commandsLast30Days"; label: string }[] = [
  { key: "guildCount", label: "serveurs" },
  { key: "memberCount", label: "membres" },
  { key: "commandsLast30Days", label: "commandes sur 30 jours" },
];

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

  return (
    <section className="landing-stats" aria-label="Statistiques en direct">
      <div className="landing-stats-grid">
        {ITEMS.map((item) => (
          <div key={item.key} className="landing-stat">
            <span className="landing-stat-value">
              {stats ? formatCompact(stats[item.key]) : "—"}
            </span>
            <span className="landing-stat-label">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="landing-status" role="status">
        {stats ? (
          <>
            <span
              className={`landing-live-dot${stats.online ? "" : " is-offline"}`}
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
