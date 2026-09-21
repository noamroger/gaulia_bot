"use client";

import { useEffect, useState } from "react";

import { useLocale, useTranslation } from "@/i18n";
import { api } from "@/lib/api";
import { formatCompact } from "@/lib/format";
import type { PublicStats } from "@/lib/types";

const REFRESH_INTERVAL_MS = 60_000;

type StatField = "guildCount" | "memberCount" | "commandsLast30Days";

const ITEMS: { field: StatField; label: string }[] = [
  { field: "guildCount", label: "guilds" },
  { field: "memberCount", label: "members" },
  { field: "commandsLast30Days", label: "commands" },
];

export function LiveStats() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [failed, setFailed] = useState(false);
  const t = useTranslation();
  const locale = useLocale();

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
    <section className="landing-stats" aria-label={t("home.stats.ariaLabel")}>
      <div className="landing-stats-grid">
        {ITEMS.map((item) => (
          <div key={item.field} className="landing-stat">
            <span className="landing-stat-value">
              {stats ? formatCompact(stats[item.field], locale) : "-"}
            </span>
            <span className="landing-stat-label">{t(`home.stats.${item.label}`)}</span>
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
            {t("home.stats.status", {
              state: t(stats.online ? "home.stats.online" : "home.stats.offline"),
            })}
          </>
        ) : failed ? (
          t("home.stats.unavailable")
        ) : (
          t("home.stats.loading")
        )}
      </p>
    </section>
  );
}
