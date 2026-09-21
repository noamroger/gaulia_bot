import { GauliaError } from "../errors";
import type { Translator } from "../../i18n";

const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Parses "10m", "2h", "1d", "45s" or a bare number of seconds. */
export function parseDurationMs(input: string): number {
  const trimmed = input.trim().toLowerCase();

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }

  const match = /^(\d+)\s*(s|m|h|d)$/.exec(trimmed);
  if (!match) {
    throw new GauliaError("common.duration.invalid");
  }

  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit!]!;
}

/** Human readable duration, whose unit letters differ per language ("2d" against "2j"). */
export function formatDurationMs(ms: number, t: Translator): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days) parts.push(t("common.duration.day", { count: days }));
  if (hours) parts.push(t("common.duration.hour", { count: hours }));
  if (minutes) parts.push(t("common.duration.minute", { count: minutes }));
  if (seconds && parts.length === 0) parts.push(t("common.duration.second", { count: seconds }));

  return parts.length ? parts.join(" ") : t("common.duration.zero");
}
