"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export interface SeriesPoint {
  key: string;
  /** null means no data: the line breaks there. */
  value: number | null;
}

interface TimeSeriesChartProps {
  points: SeriesPoint[];
  ariaLabel: string;
  height?: number;
  /** True: the axis starts at 0 (volumes). False: it frames the observed values (slow levels). */
  zeroBaseline?: boolean;
  formatTick: (value: number) => string;
  formatAxisLabel: (key: string) => string;
  formatTooltip: (point: { key: string; value: number | null }) => {
    value: string;
    detail: string;
  };
}

const PAD = { top: 22, right: 12, bottom: 28, left: 48 };
const TARGET_TICKS = 5;
const TOOLTIP_EDGE_PX = 90;
const MIN_LABEL_SPACING_PX = 72;

/** Round axis step (1, 2, 5 x 10^n) so the ticks stay readable integers. */
function niceStep(raw: number): number {
  if (raw <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / magnitude;
  const multiplier = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return multiplier * magnitude;
}

function yDomain(
  values: number[],
  zeroBaseline: boolean,
): { min: number; max: number; step: number } {
  const high = Math.max(0, ...values);
  if (zeroBaseline || values.length === 0) {
    const step = niceStep(high / TARGET_TICKS);
    return { min: 0, max: step * Math.max(1, Math.ceil(high / step)), step };
  }

  const low = Math.min(...values);
  const spread = high - low;
  const padding = spread === 0 ? Math.max(1, Math.abs(high) * 0.05) : 0;
  const step = niceStep((spread + padding * 2) / TARGET_TICKS);
  const min = Math.max(0, Math.floor((low - padding) / step) * step);
  const max = Math.ceil((high + padding) / step) * step;
  return { min, max: max > min ? max : min + step, step };
}

export function TimeSeriesChart({
  points,
  ariaLabel,
  height = 240,
  zeroBaseline = false,
  formatTick,
  formatAxisLabel,
  formatTooltip,
}: TimeSeriesChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  // SVG gradients are referenced by id, which must stay unique when several charts share the
  // page. useId wraps its value in special characters, stripped here so url(#...) stays simple.
  const gradientId = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const lineGradient = `${gradientId}-line`;
  const areaGradient = `${gradientId}-area`;

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
  const plotHeight = height - PAD.top - PAD.bottom;
  const baseline = PAD.top + plotHeight;

  const values = points.flatMap((point) => (point.value === null ? [] : [point.value]));
  const domain = yDomain(values, zeroBaseline);
  const tickCount = Math.round((domain.max - domain.min) / domain.step);

  const xAt = (index: number): number =>
    PAD.left + (count <= 1 ? plotWidth / 2 : (index * plotWidth) / lastIndex);
  const yAt = (value: number): number =>
    baseline - ((value - domain.min) / (domain.max - domain.min)) * plotHeight;

  const segments: number[][] = [];
  let current: number[] = [];
  points.forEach((point, index) => {
    if (point.value === null) {
      if (current.length > 0) segments.push(current);
      current = [];
    } else {
      current.push(index);
    }
  });
  if (current.length > 0) segments.push(current);

  const valueAt = (index: number): number => points[index]?.value ?? domain.min;
  const segmentLine = (segment: number[]): string =>
    segment
      .map((index, position) => `${position === 0 ? "M" : "L"}${xAt(index)},${yAt(valueAt(index))}`)
      .join("");
  const linePath = segments.map(segmentLine).join("");
  const areaPath = segments
    .map(
      (segment) =>
        `${segmentLine(segment)}L${xAt(segment[segment.length - 1]!)},${baseline}L${xAt(segment[0]!)},${baseline}Z`,
    )
    .join("");
  const isolated = segments.filter((segment) => segment.length === 1).map((segment) => segment[0]!);

  const maxLabels = Math.max(2, Math.floor(plotWidth / MIN_LABEL_SPACING_PX));
  const labelEvery = Math.max(1, Math.ceil(count / maxLabels));
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
    setHoverIndex((index) => Math.min(lastIndex, Math.max(0, (index ?? lastIndex) + delta)));
  }

  const lastValueIndex = segments.length > 0 ? segments[segments.length - 1]!.slice(-1)[0]! : null;
  const hovered = hoverIndex !== null ? points[hoverIndex] : undefined;
  const tooltip = hovered ? formatTooltip(hovered) : null;
  const tooltipX = hoverIndex !== null ? xAt(hoverIndex) : 0;
  const tooltipShift =
    tooltipX < TOOLTIP_EDGE_PX ? "0%" : tooltipX > width - TOOLTIP_EDGE_PX ? "-100%" : "-50%";

  const marker = (index: number) => (
    <circle
      cx={xAt(index)}
      cy={yAt(valueAt(index))}
      r={4}
      fill="var(--series-1)"
      stroke="var(--bg-elevated)"
      strokeWidth={2}
    />
  );

  return (
    <div ref={wrapperRef} className="chart-wrapper" style={{ minHeight: height }}>
      {width > 0 && count > 0 && (
        <svg
          className="chart-svg"
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHoverIndex(null)}
          onFocus={() => setHoverIndex(lastIndex)}
          onBlur={() => setHoverIndex(null)}
          onKeyDown={onKeyDown}
        >
          <defs>
            <linearGradient id={lineGradient} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--series-1)" />
              <stop offset="100%" stopColor="var(--series-2)" />
            </linearGradient>
            <linearGradient id={areaGradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-2)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {Array.from({ length: tickCount + 1 }, (_, tick) => {
            const value = domain.min + domain.step * tick;
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
                  {formatTick(value)}
                </text>
              </g>
            );
          })}

          {xLabelIndexes.map((index) => (
            <text
              key={index}
              className="chart-tick"
              x={xAt(index)}
              y={height - 8}
              textAnchor={index === 0 ? "start" : index === lastIndex ? "end" : "middle"}
            >
              {formatAxisLabel(points[index]!.key)}
            </text>
          ))}

          <path d={areaPath} fill={`url(#${areaGradient})`} />
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${lineGradient})`}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {isolated.map((index) => (
            <circle
              key={index}
              cx={xAt(index)}
              cy={yAt(valueAt(index))}
              r={2.5}
              fill="var(--series-1)"
            />
          ))}

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
              {hovered.value !== null && marker(hoverIndex)}
            </>
          ) : (
            lastValueIndex !== null && (
              <>
                {marker(lastValueIndex)}
                <text
                  className="chart-end-label"
                  x={xAt(lastValueIndex)}
                  y={yAt(valueAt(lastValueIndex)) - 10}
                  textAnchor="end"
                >
                  {formatTick(valueAt(lastValueIndex))}
                </text>
              </>
            )
          )}
        </svg>
      )}

      {tooltip && hoverIndex !== null && (
        <div
          className="chart-tooltip"
          role="status"
          style={{ left: tooltipX, top: 0, transform: `translateX(${tooltipShift})` }}
        >
          <strong>{tooltip.value}</strong>
          <span>{tooltip.detail}</span>
        </div>
      )}
    </div>
  );
}
