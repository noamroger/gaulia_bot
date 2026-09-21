"use client";

import { useLocale, useTranslation, type AppLocale, type Translator } from "@/i18n";
import { formatCompact, formatDateTime, formatNumber, formatShortDate } from "@/lib/format";
import type { ShardMetricHistory, ShardMetricPoint } from "@/lib/types";

import { TimeSeriesChart } from "./TimeSeriesChart";

const CHART_HEIGHT = 200;

type ChartId = "guilds" | "members" | "ping";

interface HistoryChart {
  id: ChartId;
  pick: (point: ShardMetricPoint) => number | null;
  /** True for a volume read from 0, false for a level that only needs its own range. */
  zeroBaseline: boolean;
}

const CHARTS: HistoryChart[] = [
  { id: "guilds", pick: (point) => point.guildCount, zeroBaseline: false },
  { id: "members", pick: (point) => point.memberCount, zeroBaseline: false },
  { id: "ping", pick: (point) => point.ping, zeroBaseline: true },
];

function tickFormatter(id: ChartId, locale: AppLocale, t: Translator): (value: number) => string {
  if (id === "ping") {
    return (value) => t("admin.units.milliseconds", { value: formatNumber(value, locale) });
  }
  return (value) => formatCompact(value, locale);
}

/** Full wording used in the tooltip and in the data table, unlike the shorter axis ticks. */
function valueFormatter(id: ChartId, locale: AppLocale, t: Translator): (value: number) => string {
  if (id === "ping") {
    return (value) => t("admin.units.milliseconds", { value: formatNumber(value, locale) });
  }
  return (value) =>
    t(`admin.charts.history.${id}.value`, { count: value, value: formatNumber(value, locale) });
}

function stepLabel(stepMinutes: number, t: Translator): string {
  return stepMinutes < 60
    ? t("admin.charts.history.stepMinutes", { value: stepMinutes })
    : t("admin.charts.history.stepHours", { value: stepMinutes / 60 });
}

export function ShardHistoryCharts({
  history,
  days,
}: {
  history: ShardMetricHistory;
  days: number;
}) {
  const t = useTranslation();
  const locale = useLocale();
  const hasData = history.points.some((point) => point.guildCount !== null);

  return (
    <div className="history-grid">
      {CHARTS.map((chart) => {
        const rows = history.points.filter((point) => chart.pick(point) !== null).reverse();
        const title = t(`admin.charts.history.${chart.id}.title`);
        const formatValue = valueFormatter(chart.id, locale, t);

        return (
          <section key={chart.id} className="card">
            <h2 className="card-title">{title}</h2>
            <p className="card-subtitle">
              {t("admin.charts.history.subtitle", {
                scope: t(`admin.charts.history.${chart.id}.subtitle`),
                days,
                step: stepLabel(history.stepMinutes, t),
              })}
            </p>

            {hasData ? (
              <>
                <TimeSeriesChart
                  points={history.points.map((point) => ({
                    key: point.at,
                    value: chart.pick(point),
                  }))}
                  ariaLabel={t("admin.charts.history.ariaLabel", { title, days })}
                  height={CHART_HEIGHT}
                  zeroBaseline={chart.zeroBaseline}
                  formatTick={tickFormatter(chart.id, locale, t)}
                  formatAxisLabel={(key) => formatShortDate(key, locale)}
                  formatTooltip={({ key, value }) => ({
                    value: value === null ? t("admin.charts.history.noValue") : formatValue(value),
                    detail: formatDateTime(key, locale),
                  })}
                />
                <details className="data-table-toggle">
                  <summary>{t("admin.charts.showData")}</summary>
                  <div className="history-table">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{t("admin.charts.history.period")}</th>
                          <th>{t(`admin.charts.history.${chart.id}.column`)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((point) => (
                          <tr key={point.at}>
                            <td>{formatDateTime(point.at, locale)}</td>
                            <td className="numeric">{formatValue(chart.pick(point) ?? 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            ) : (
              <div className="empty-state history-empty">{t("admin.charts.history.empty")}</div>
            )}
          </section>
        );
      })}
    </div>
  );
}
