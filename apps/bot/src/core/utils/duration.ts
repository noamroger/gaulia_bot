import { GauliaError } from "../errors";

const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Parse une durée type "10m", "2h", "1d", "45s" ou un nombre brut de secondes. */
export function parseDurationMs(input: string): number {
  const trimmed = input.trim().toLowerCase();

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }

  const match = /^(\d+)\s*(s|m|h|d)$/.exec(trimmed);
  if (!match) {
    throw new GauliaError("Format de durée invalide. Exemples valides : `30s`, `10m`, `2h`, `1d`.");
  }

  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit!]!;
}

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days) parts.push(`${days}j`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds && parts.length === 0) parts.push(`${seconds}s`);

  return parts.length ? parts.join(" ") : "0s";
}
