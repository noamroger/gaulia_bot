"use client";

import { formatDay, formatNumber } from "@/lib/format";

import { TimeSeriesChart } from "./TimeSeriesChart";

export interface DailyPoint {
  date: string;
  count: number;
}

export function DailyUsageChart({ points }: { points: DailyPoint[] }) {
  return (
    <TimeSeriesChart
      points={points.map((point) => ({ key: point.date, value: point.count }))}
      ariaLabel={`Commandes utilisées par jour sur ${points.length} jours`}
      zeroBaseline
      formatTick={formatNumber}
      formatAxisLabel={formatDay}
      formatTooltip={({ key, value }) => ({
        value: formatNumber(value ?? 0),
        detail: `commandes · ${formatDay(key)}`,
      })}
    />
  );
}
