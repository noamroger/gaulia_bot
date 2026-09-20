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
 * Programme la destruction du player après une période d'inactivité, sauf si `stay247` est actif
 * (mode 24/7 premium) - dans ce cas le player reste connecté indéfiniment.
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
