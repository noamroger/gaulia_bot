/** Display helpers shared by every adventure view. */

import type { Translator } from "../../../i18n";

const BAR_LENGTH = 12;

export function progressBar(ratio: number, length = BAR_LENGTH): string {
  const filled = Math.max(0, Math.min(length, Math.round(ratio * length)));
  return `${"█".repeat(filled)}${"░".repeat(length - filled)}`;
}

/** Grouped number in the reader's own language ("1,000" against "1 000"). */
export function formatNumber(t: Translator, value: number): string {
  return new Intl.NumberFormat(t.locale).format(Math.round(value));
}

export function gold(t: Translator, value: number): string {
  return `${formatNumber(t, value)} 🪙`;
}

/** Objective checkbox, used by the quests and the chapters. */
export function checkbox(done: boolean): string {
  return done ? "✅" : "▫️";
}

export function counter(t: Translator, progress: number, target: number): string {
  return `${formatNumber(t, progress)} / ${formatNumber(t, target)}`;
}
