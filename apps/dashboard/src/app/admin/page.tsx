"use client";

import { useEffect, useState } from "react";

import { DailyUsageChart } from "@/components/stats/DailyUsageChart";
import { StatTile } from "@/components/stats/StatTile";
import { TopCommandsChart } from "@/components/stats/TopCommandsChart";
import { api } from "@/lib/api";
import { formatCompact, formatDay, formatNumber, formatRelative, formatUptime } from "@/lib/format";
import type { AdminStats } from "@/lib/types";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const REFRESH_INTERVAL_MS = 30_000;

/** Libellés des dossiers `modules/<module>` du bot ; une catégorie inconnue garde son nom. */
const CATEGORY_LABELS: Record<string, string> = {
  general: "Général",
  moderation: "Modération",
  automod: "Automod",
  music: "Musique",
  fun: "Fun",
  premium: "Premium",
  other: "Autre",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export default function AdminStatsPage() {
  const [days, setDays] = useState<Range>(30);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const excludeParam = [...excluded].sort().join(",");

  useEffect(() => {
    let cancelled = false;
    const query = excludeParam ? `&exclude=${encodeURIComponent(excludeParam)}` : "";

    async function load(): Promise<void> {
      setRefreshing(true);
      try {
        const data = await api.get<AdminStats>(`/admin/stats?days=${days}${query}`);
        if (!cancelled) {
          setStats(data);
          setFailed(false);
          setNow(Date.now());
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }

    void load();
    const timer = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [days, excludeParam]);

  function toggleCategory(category: string): void {
    setExcluded((current) =>
      current.includes(category)
        ? current.filter((value) => value !== category)
        : [...current, category],
    );
  }

  const categories = stats?.commands.categories ?? [];
  const selectedLabels = categories
    .filter(({ category }) => !excluded.includes(category))
    .map(({ category }) => categoryLabel(category));
  const scopeLabel =
    excluded.length === 0
      ? "toutes catégories"
      : selectedLabels.length === 0
        ? "aucune catégorie sélectionnée"
        : selectedLabels.join(", ");

  return (
    <div>
      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Période">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              aria-pressed={days === range}
              onClick={() => setDays(range)}
            >
              {range} jours
            </button>
          ))}
        </div>
        <span className="text-muted" style={{ fontSize: 13 }}>
          Actualisation automatique toutes les 30 s
        </span>
      </div>

      {categories.length > 0 && (
        <div className="category-filter" role="group" aria-label="Catégories de commandes">
          <span className="category-filter-label">Catégories</span>
          {categories.map(({ category, count }) => (
            <button
              key={category}
              type="button"
              className="filter-chip"
              aria-pressed={!excluded.includes(category)}
              onClick={() => toggleCategory(category)}
            >
              {categoryLabel(category)}
              <span className="numeric">{formatCompact(count)}</span>
            </button>
          ))}
          {excluded.length > 0 && (
            <button type="button" className="filter-reset" onClick={() => setExcluded([])}>
              Tout afficher
            </button>
          )}
        </div>
      )}

      {stats === null ? (
        failed ? (
          <div className="empty-state">Impossible de charger les statistiques.</div>
        ) : (
          <p className="text-muted">Chargement…</p>
        )
      ) : (
        <div className={refreshing ? "is-refreshing" : undefined}>
          <div className="kpi-grid">
            <StatTile label="Serveurs" value={formatCompact(stats.guildCount)} />
            <StatTile label="Membres" value={formatCompact(stats.memberCount)} />
            <StatTile
              label="Commandes"
              value={formatCompact(stats.commands.totalInRange)}
              hint={`sur ${stats.days} jours · ${formatCompact(stats.commands.totalAllTime)} au total`}
            />
            <StatTile
              label="Shards en ligne"
              value={`${stats.onlineShardCount} / ${stats.shardCount}`}
            />
            <StatTile
              label="Ping moyen"
              value={stats.averagePing !== null ? `${stats.averagePing} ms` : "—"}
            />
            <StatTile label="Lecteurs musique actifs" value={formatNumber(stats.playerCount)} />
          </div>

          <div className="chart-grid">
            <section className="card">
              <h2 className="card-title">Commandes par jour</h2>
              <p className="card-subtitle">
                {stats.days} derniers jours, {scopeLabel}
              </p>
              <DailyUsageChart points={stats.commands.daily} />
              <details className="data-table-toggle">
                <summary>Voir les données</summary>
                <div style={{ overflowX: "auto", maxHeight: 260 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Jour</th>
                        <th>Commandes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...stats.commands.daily].reverse().map((day) => (
                        <tr key={day.date}>
                          <td>{formatDay(day.date)}</td>
                          <td className="numeric">{formatNumber(day.count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>

            <section className="card">
              <h2 className="card-title">Commandes les plus utilisées</h2>
              <p className="card-subtitle">
                Top 10 sur {stats.days} jours, {scopeLabel}
              </p>
              {stats.commands.topCommands.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 0" }}>
                  Aucune commande utilisée sur cette période.
                </div>
              ) : (
                <TopCommandsChart
                  commands={stats.commands.topCommands}
                  total={stats.commands.totalInRange}
                />
              )}
            </section>
          </div>

          <h2 className="section-title">Shards</h2>
          {stats.shards.length === 0 ? (
            <div className="empty-state">Aucun shard n&apos;a encore envoyé de heartbeat.</div>
          ) : (
            <div className="shard-grid">
              {stats.shards.map((shard) => (
                <section key={shard.shardId} className="card">
                  <div className="shard-card-header">
                    <h3 className="card-title" style={{ margin: 0 }}>
                      Shard #{shard.shardId}
                    </h3>
                    <span className="status">
                      <span
                        className={`status-dot ${shard.online ? "online" : "offline"}`}
                        aria-hidden="true"
                      />
                      {shard.online ? "En ligne" : "Hors ligne"}
                    </span>
                  </div>
                  <dl className="shard-metrics">
                    <div>
                      <dt>Serveurs</dt>
                      <dd>{formatNumber(shard.guildCount)}</dd>
                    </div>
                    <div>
                      <dt>Membres</dt>
                      <dd>{formatCompact(shard.memberCount)}</dd>
                    </div>
                    <div>
                      <dt>Ping</dt>
                      <dd>{shard.online ? `${shard.ping} ms` : "—"}</dd>
                    </div>
                    <div>
                      <dt>Mémoire</dt>
                      <dd>{shard.online ? `${formatNumber(shard.memoryMb)} Mo` : "—"}</dd>
                    </div>
                    <div>
                      <dt>Lecteurs actifs</dt>
                      <dd>{shard.online ? formatNumber(shard.playerCount) : "—"}</dd>
                    </div>
                    <div>
                      <dt>Uptime</dt>
                      <dd>{shard.online ? formatUptime(shard.startedAt, now) : "—"}</dd>
                    </div>
                  </dl>
                  <p className="stat-hint" style={{ margin: "12px 0 0" }}>
                    Dernier heartbeat {formatRelative(shard.updatedAt, now)}
                  </p>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
