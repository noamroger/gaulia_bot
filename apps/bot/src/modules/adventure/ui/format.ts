/** Helpers d'affichage partagés par toutes les vues de l'aventure. */

const BAR_LENGTH = 12;

export function progressBar(ratio: number, length = BAR_LENGTH): string {
  const filled = Math.max(0, Math.min(length, Math.round(ratio * length)));
  return `${"█".repeat(filled)}${"░".repeat(length - filled)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value));
}

export function gold(value: number): string {
  return `${formatNumber(value)} 🪙`;
}

/** Durée courte et lisible : « 3 j 4 h », « 12 min ». */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60_000));
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return hours > 0 ? `${days} j ${hours} h` : `${days} j`;
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  return `${minutes} min`;
}

/** Coche d'objectif, utilisée par les quêtes et les chapitres. */
export function checkbox(done: boolean): string {
  return done ? "✅" : "▫️";
}

export function counter(progress: number, target: number): string {
  return `${formatNumber(progress)} / ${formatNumber(target)}`;
}
