"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { formatDay, formatNumber } from "@/lib/format";

export interface DailyPoint {
  date: string;
  count: number;
}

const HEIGHT = 240;
const PAD = { top: 22, right: 12, bottom: 28, left: 44 };
const TARGET_TICKS = 5;
const TOOLTIP_EDGE_PX = 90;

/** Pas d'axe "rond" (1, 2, 5 × 10^n) pour que les graduations restent des entiers lisibles. */
function niceStep(raw: number): number {
  if (raw <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / magnitude;
  const multiplier = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return multiplier * magnitude;
}

export function DailyUsageChart({ points }: { points: DailyPoint[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const count = points.length;
  const lastIndex = count - 1;
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const baseline = PAD.top + plotHeight;
  const maxCount = Math.max(0, ...points.map((point) => point.count));
  const step = niceStep(maxCount / TARGET_TICKS);
  const tickCount = Math.max(1, Math.ceil(maxCount / step));
  const yMax = step * tickCount;

  const xAt = (index: number): number =>
    PAD.left + (count <= 1 ? plotWidth / 2 : (index * plotWidth) / lastIndex);
  const yAt = (value: number): number => baseline - (value / yMax) * plotHeight;

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${xAt(index)},${yAt(point.count)}`)
    .join("");
  const areaPath =
    count > 0 ? `${linePath}L${xAt(lastIndex)},${baseline}L${xAt(0)},${baseline}Z` : "";

  const labelEvery = Math.max(1, Math.ceil(count / 6));
  const xLabelIndexes = points
    .map((_, index) => index)
    .filter(
      (index) =>
        index === lastIndex || (index % labelEvery === 0 && lastIndex - index >= labelEvery / 2),
    );

  function onPointerMove(event: PointerEvent<SVGSVGElement>): void {
    if (count === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left - PAD.left;
    const index = count <= 1 ? 0 : Math.round((relativeX / plotWidth) * lastIndex);
    setHoverIndex(Math.min(lastIndex, Math.max(0, index)));
  }

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    setHoverIndex((current) => Math.min(lastIndex, Math.max(0, (current ?? lastIndex) + delta)));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : undefined;
  const last = points[lastIndex];
  const tooltipX = hoverIndex !== null ? xAt(hoverIndex) : 0;
  const tooltipShift =
    tooltipX < TOOLTIP_EDGE_PX ? "0%" : tooltipX > width - TOOLTIP_EDGE_PX ? "-100%" : "-50%";

  return (
    <div ref={wrapperRef} className="chart-wrapper" style={{ minHeight: HEIGHT }}>
      {width > 0 && count > 0 && (
        <svg
          className="chart-svg"
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Commandes utilisées par jour sur ${count} jours`}
          tabIndex={0}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHoverIndex(null)}
          onFocus={() => setHoverIndex(lastIndex)}
          onBlur={() => setHoverIndex(null)}
          onKeyDown={onKeyDown}
        >
          {Array.from({ length: tickCount + 1 }, (_, tick) => {
            const value = step * tick;
            const y = yAt(value);
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y}
                  y2={y}
                  stroke={tick === 0 ? "var(--chart-axis)" : "var(--chart-grid)"}
                  strokeWidth={1}
                />
                <text
                  className="chart-tick"
                  x={PAD.left - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {formatNumber(value)}
                </text>
              </g>
            );
          })}

          {xLabelIndexes.map((index) => (
            <text
              key={index}
              className="chart-tick"
              x={xAt(index)}
              y={HEIGHT - 8}
              textAnchor={index === 0 ? "start" : index === lastIndex ? "end" : "middle"}
            >
              {formatDay(points[index]!.date)}
            </text>
          ))}

          <path d={areaPath} fill="var(--series-1)" fillOpacity={0.1} />
          <path
            d={linePath}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {hovered && hoverIndex !== null ? (
            <>
              <line
                x1={xAt(hoverIndex)}
                x2={xAt(hoverIndex)}
                y1={PAD.top}
                y2={baseline}
                stroke="var(--chart-axis)"
                strokeWidth={1}
              />
              <circle
                cx={xAt(hoverIndex)}
                cy={yAt(hovered.count)}
                r={4}
                fill="var(--series-1)"
                stroke="var(--bg-elevated)"
                strokeWidth={2}
              />
            </>
          ) : (
            last && (
              <>
                <circle
                  cx={xAt(lastIndex)}
                  cy={yAt(last.count)}
                  r={4}
                  fill="var(--series-1)"
                  stroke="var(--bg-elevated)"
                  strokeWidth={2}
                />
                <text
                  className="chart-end-label"
                  x={xAt(lastIndex)}
                  y={yAt(last.count) - 10}
                  textAnchor="end"
                >
                  {formatNumber(last.count)}
                </text>
              </>
            )
          )}
        </svg>
      )}

      {hovered && hoverIndex !== null && (
        <div
          className="chart-tooltip"
          role="status"
          style={{ left: tooltipX, top: 0, transform: `translateX(${tooltipShift})` }}
        >
          <strong>{formatNumber(hovered.count)}</strong>
          <span>commandes · {formatDay(hovered.date)}</span>
        </div>
      )}
    </div>
  );
}
