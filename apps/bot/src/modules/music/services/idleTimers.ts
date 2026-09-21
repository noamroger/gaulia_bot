import type { Player } from "lavalink-client";

const IDLE_DESTROY_MS = 5 * 60 * 1000;

const idleTimers = new Map<string, NodeJS.Timeout>();

export function clearIdleTimer(guildId: string): void {
  const timer = idleTimers.get(guildId);
  if (timer) {
    clearTimeout(timer);
    idleTimers.delete(guildId);
  }
}

/**
 * Schedules the destruction of the player after a while without music, unless `stay247` is on
 * (premium 24/7 mode), where the player stays connected for good.
 */
export function scheduleIdleDestroy(player: Player, stay247: boolean): void {
  clearIdleTimer(player.guildId);
  if (stay247) return;

  const timer = setTimeout(() => {
    idleTimers.delete(player.guildId);
    if (!player.playing) {
      void player.destroy();
    }
  }, IDLE_DESTROY_MS);

  idleTimers.set(player.guildId, timer);
}
