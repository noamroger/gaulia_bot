"use client";

import { formatCompact, formatDateTime, formatNumber, formatShortDate } from "@/lib/format";
import type { ShardMetricHistory, ShardMetricPoint } from "@/lib/types";

import { TimeSeriesChart } from "./TimeSeriesChart";

const CHART_HEIGHT = 200;

interface HistoryChart {
  id: string;
  title: string;
  subtitle: string;
  column: string;
  pick: (point: ShardMetricPoint) => number | null;
  formatTick: (value: number) => string;
  formatValue: (value: number) => string;
  zeroBaseline: boolean;
}

const formatMs = (value: number): string => `${formatNumber(value)} ms`;

const CHARTS: HistoryChart[] = [
  {
    id: "guilds",
    title: "Serveurs",
    subtitle: "Total des shards",
    column: "Serveurs",
    pick: (point) => point.guildCount,
    formatTick: formatCompact,
    formatValue: (value) => `${formatNumber(value)} serveurs`,
    zeroBaseline: false,
  },
  {
    id: "members",
    title: "Utilisateurs",
    subtitle: "Membres cumulés des serveurs",
    column: "Membres",
    pick: (point) => point.memberCount,
    formatTick: formatCompact,
    formatValue: (value) => `${formatNumber(value)} membres`,
    zeroBaseline: false,
  },
  {
    id: "ping",
    title: "Ping",
    subtitle: "Moyenne des shards",
    column: "Ping",
    pick: (point) => point.ping,
    formatTick: formatMs,
    formatValue: formatMs,
    zeroBaseline: true,
  },
];

function stepLabel(stepMinutes: number): string {
  return stepMinutes < 60 ? `${stepMinutes} min` : `${stepMinutes / 60} h`;
}

export function ShardHistoryCharts({
  history,
  days,
}: {
  history: ShardMetricHistory;
  days: number;
}) {
  const hasData = history.points.some((point) => point.guildCount !== null);

  return (
    <div className="history-grid">
      {CHARTS.map((chart) => {
        const rows = history.points.filter((point) => chart.pick(point) !== null).reverse();
        return (
          <section key={chart.id} className="card">
            <h2 className="card-title">{chart.title}</h2>
            <p className="card-subtitle">
              {chart.subtitle} · {days} jours · pas de {stepLabel(history.stepMinutes)}
            </p>

            {hasData ? (
              <>
                <TimeSeriesChart
                  points={history.points.map((point) => ({
                    key: point.at,
                    value: chart.pick(point),
                  }))}
                  ariaLabel={`${chart.title} sur ${days} jours`}
                  height={CHART_HEIGHT}
                  zeroBaseline={chart.zeroBaseline}
                  formatTick={chart.formatTick}
                  formatAxisLabel={formatShortDate}
                  formatTooltip={({ key, value }) => ({
                    value: value === null ? "Aucune donnée" : chart.formatValue(value),
                    detail: formatDateTime(key),
                  })}
                />
                <details className="data-table-toggle">
                  <summary>Voir les données</summary>
                  <div className="history-table">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Période</th>
                          <th>{chart.column}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((point) => (
                          <tr key={point.at}>
                            <td>{formatDateTime(point.at)}</td>
                            <td className="numeric">{chart.formatValue(chart.pick(point) ?? 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            ) : (
              <div className="empty-state history-empty">
                Pas encore d&apos;historique : il se remplit à chaque heartbeat des shards.
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
