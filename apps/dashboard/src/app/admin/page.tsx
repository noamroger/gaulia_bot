"use client";

import { useEffect, useState } from "react";

import { DailyUsageChart } from "@/components/stats/DailyUsageChart";
import { ShardHistoryCharts } from "@/components/stats/ShardHistoryCharts";
import { StatTile } from "@/components/stats/StatTile";
import { TopCommandsChart } from "@/components/stats/TopCommandsChart";
import { useLocale, useTranslation, type Translator } from "@/i18n";
import { api } from "@/lib/api";
import { formatCompact, formatDay, formatNumber, formatRelative, formatUptime } from "@/lib/format";
import type { AdminStats } from "@/lib/types";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const REFRESH_INTERVAL_MS = 30_000;

/** `modules/<module>` folders of the bot; an unknown category keeps its raw name. */
const CATEGORIES = ["general", "moderation", "automod", "music", "fun", "premium", "other"];

function categoryLabel(category: string, t: Translator): string {
  return CATEGORIES.includes(category) ? t(`admin.stats.categories.names.${category}`) : category;
}

export default function AdminStatsPage() {
  const [days, setDays] = useState<Range>(30);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const t = useTranslation();
  const locale = useLocale();

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
    .map(({ category }) => categoryLabel(category, t));
  const scope =
    excluded.length === 0
      ? t("admin.stats.scope.all")
      : selectedLabels.length === 0
        ? t("admin.stats.scope.none")
        : selectedLabels.join(", ");

  return (
    <div>
      <div className="toolbar">
        <div className="segmented" role="group" aria-label={t("admin.stats.rangeLabel")}>
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              aria-pressed={days === range}
              onClick={() => setDays(range)}
            >
              {t("admin.stats.rangeOption", { days: range })}
            </button>
          ))}
        </div>
        <span className="text-muted" style={{ fontSize: 13 }}>
          {t("admin.stats.autoRefresh", { seconds: REFRESH_INTERVAL_MS / 1000 })}
        </span>
      </div>

      {stats === null ? (
        failed ? (
          <div className="empty-state">{t("admin.stats.loadFailed")}</div>
        ) : (
          <p className="text-muted">{t("common.state.loading")}</p>
        )
      ) : (
        <div className={refreshing ? "is-refreshing" : undefined}>
          <div className="kpi-grid">
            <StatTile
              label={t("admin.stats.tiles.guilds")}
              value={formatCompact(stats.guildCount, locale)}
            />
            <StatTile
              label={t("admin.stats.tiles.members")}
              value={formatCompact(stats.memberCount, locale)}
            />
            <StatTile
              label={t("admin.stats.tiles.commands")}
              value={formatCompact(stats.commands.totalInRange, locale)}
              hint={t("admin.stats.tiles.commandsHint", {
                days: stats.days,
                total: formatCompact(stats.commands.totalAllTime, locale),
              })}
            />
            <StatTile
              label={t("admin.stats.tiles.shards")}
              value={t("admin.stats.tiles.shardsValue", {
                online: stats.onlineShardCount,
                total: stats.shardCount,
              })}
            />
            <StatTile
              label={t("admin.stats.tiles.ping")}
              value={
                stats.averagePing !== null
                  ? t("admin.units.milliseconds", {
                      value: formatNumber(stats.averagePing, locale),
                    })
                  : "-"
              }
            />
            <StatTile
              label={t("admin.stats.tiles.players")}
              value={formatNumber(stats.playerCount, locale)}
            />
          </div>

          <ShardHistoryCharts history={stats.history} days={stats.days} />

          <div className="chart-grid">
            <section className="card">
              <h2 className="card-title">{t("admin.stats.daily.title")}</h2>
              <p className="card-subtitle">
                {t("admin.stats.daily.subtitle", { days: stats.days, scope })}
              </p>
              <DailyUsageChart points={stats.commands.daily} />
              <details className="data-table-toggle">
                <summary>{t("admin.charts.showData")}</summary>
                <div style={{ overflowX: "auto", maxHeight: 260 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t("admin.stats.daily.day")}</th>
                        <th>{t("admin.stats.daily.count")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...stats.commands.daily].reverse().map((day) => (
                        <tr key={day.date}>
                          <td>{formatDay(day.date, locale)}</td>
                          <td className="numeric">{formatNumber(day.count, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>

            <section className="card">
              <h2 className="card-title">{t("admin.stats.top.title")}</h2>
              <p className="card-subtitle">
                {t("admin.stats.top.subtitle", { days: stats.days, scope })}
              </p>
              {stats.commands.topCommands.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 0" }}>
                  {t("admin.stats.top.empty")}
                </div>
              ) : (
                <TopCommandsChart
                  commands={stats.commands.topCommands}
                  total={stats.commands.totalInRange}
                />
              )}
            </section>
          </div>

          {categories.length > 0 && (
            <div
              className="category-filter"
              role="group"
              aria-label={t("admin.stats.categories.groupLabel")}
            >
              <span className="category-filter-label">{t("admin.stats.categories.label")}</span>
              {categories.map(({ category, count }) => (
                <button
                  key={category}
                  type="button"
                  className="filter-chip"
                  aria-pressed={!excluded.includes(category)}
                  onClick={() => toggleCategory(category)}
                >
                  {categoryLabel(category, t)}
                  <span className="numeric">{formatCompact(count, locale)}</span>
                </button>
              ))}
              {excluded.length > 0 && (
                <button type="button" className="filter-reset" onClick={() => setExcluded([])}>
                  {t("admin.stats.categories.showAll")}
                </button>
              )}
            </div>
          )}

          <h2 className="section-title">{t("admin.stats.shards.title")}</h2>
          {stats.shards.length === 0 ? (
            <div className="empty-state">{t("admin.stats.shards.empty")}</div>
          ) : (
            <div className="shard-grid">
              {stats.shards.map((shard) => (
                <section key={shard.shardId} className="card">
                  <div className="shard-card-header">
                    <h3 className="card-title" style={{ margin: 0 }}>
                      {t("admin.stats.shards.name", { id: shard.shardId })}
                    </h3>
                    <span className="status">
                      <span
                        className={`status-dot ${shard.online ? "online" : "offline"}`}
                        aria-hidden="true"
                      />
                      {shard.online
                        ? t("admin.stats.shards.online")
                        : t("admin.stats.shards.offline")}
                    </span>
                  </div>
                  <dl className="shard-metrics">
                    <div>
                      <dt>{t("admin.stats.shards.guilds")}</dt>
                      <dd>{formatNumber(shard.guildCount, locale)}</dd>
                    </div>
                    <div>
                      <dt>{t("admin.stats.shards.members")}</dt>
                      <dd>{formatCompact(shard.memberCount, locale)}</dd>
                    </div>
                    <div>
                      <dt>{t("admin.stats.shards.ping")}</dt>
                      <dd>
                        {shard.online
                          ? t("admin.units.milliseconds", {
                              value: formatNumber(shard.ping, locale),
                            })
                          : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt>{t("admin.stats.shards.memory")}</dt>
                      <dd>
                        {shard.online
                          ? t("admin.units.megabytes", {
                              value: formatNumber(shard.memoryMb, locale),
                            })
                          : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt>{t("admin.stats.shards.players")}</dt>
                      <dd>{shard.online ? formatNumber(shard.playerCount, locale) : "-"}</dd>
                    </div>
                    <div>
                      <dt>{t("admin.stats.shards.uptime")}</dt>
                      <dd>{shard.online ? formatUptime(shard.startedAt, now, locale) : "-"}</dd>
                    </div>
                  </dl>
                  <p className="stat-hint" style={{ margin: "12px 0 0" }}>
                    {t("admin.stats.shards.lastHeartbeat", {
                      when: formatRelative(shard.updatedAt, now, locale),
                    })}
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
