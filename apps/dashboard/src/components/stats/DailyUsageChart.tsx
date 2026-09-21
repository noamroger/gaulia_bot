"use client";

import { useLocale, useTranslation } from "@/i18n";
import { formatDay, formatNumber } from "@/lib/format";

import { TimeSeriesChart } from "./TimeSeriesChart";

export interface DailyPoint {
  date: string;
  count: number;
}

export function DailyUsageChart({ points }: { points: DailyPoint[] }) {
  const t = useTranslation();
  const locale = useLocale();

  return (
    <TimeSeriesChart
      points={points.map((point) => ({ key: point.date, value: point.count }))}
      ariaLabel={t("admin.charts.daily.ariaLabel", { days: points.length })}
      zeroBaseline
      formatTick={(value) => formatNumber(value, locale)}
      formatAxisLabel={(key) => formatDay(key, locale)}
      formatTooltip={({ key, value }) => ({
        value: formatNumber(value ?? 0, locale),
        detail: t("admin.charts.daily.tooltip", { day: formatDay(key, locale) }),
      })}
    />
  );
}
