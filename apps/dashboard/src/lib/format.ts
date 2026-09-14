const integerFormat = new Intl.NumberFormat("fr-FR");
const compactFormat = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  return integerFormat.format(value);
}

/** Entier lisible jusqu'à 9 999, compact au-delà (12,9 k, 4,2 M). */
export function formatCompact(value: number): string {
  return value < 10_000 ? integerFormat.format(value) : compactFormat.format(value);
}

export function formatDay(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Date courte d'un instant ISO, dans le fuseau du navigateur (« 14 sept. »). */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Date et heure d'un instant ISO, dans le fuseau du navigateur (« 14 sept., 18:00 »). */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatUptime(sinceIso: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(sinceIso).getTime()) / 1000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days} j ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

export function formatRelative(sinceIso: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - new Date(sinceIso).getTime()) / 1000));
  if (seconds < 60) return `il y a ${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  return `il y a ${Math.round(minutes / 60)} h`;
}
