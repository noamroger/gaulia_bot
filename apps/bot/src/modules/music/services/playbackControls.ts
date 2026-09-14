import type { Player } from "lavalink-client";

const SHUFFLE_KEY = "gaulia:shuffle";

export const VOLUME_STEP = 10;
export const MAX_VOLUME = 150;

export function isShuffleEnabled(player: Player): boolean {
  return player.get<boolean | undefined>(SHUFFLE_KEY) === true;
}

/** La file est mélangée à l'activation, puis après chaque ajout tant que le mode reste actif. */
export async function setShuffleEnabled(player: Player, enabled: boolean): Promise<void> {
  player.set(SHUFFLE_KEY, enabled);
  if (enabled) await player.queue.shuffle();
}

export function isLoopEnabled(player: Player): boolean {
  return player.repeatMode !== "off";
}

/** Le bouton de répétition alterne entre aucune répétition et la répétition de la file. */
export async function setLoopEnabled(player: Player, enabled: boolean): Promise<void> {
  await player.setRepeatMode(enabled ? "queue" : "off");
}

export async function setClampedVolume(
  player: Player,
  volume: number,
): Promise<{ from: number; to: number }> {
  const from = player.volume;
  const to = Math.min(Math.max(Math.round(volume), 0), MAX_VOLUME);
  if (to !== from) await player.setVolume(to);
  return { from, to };
}
