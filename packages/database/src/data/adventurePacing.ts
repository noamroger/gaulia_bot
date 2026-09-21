/**
 * Central balancing of the adventure. Everything that decides the pace of the game is here, so
 * tuning how long the game lasts never means touching a service.
 *
 * Pacing goal: finishing the story takes **at least a year** without being a chore. Two
 * independent locks take care of that:
 *
 * 1. Energy bounds how many explorations fit in a day (32 at the absolute maximum, around 24 for a
 *    player who drops in two or three times a day). With the curve below, level 100 needs about
 *    3.4 M XP: around 8 months for a relentless player, around 10 at a steady pace.
 * 2. Echo shards, which seal the chapters, are only granted by real time: a daily quest set
 *    (1/day), a weekly set (2/week), a dungeon (3/week) and a few rare finds, so around 14 shards
 *    a week at best, for a story that costs 755. Going below roughly 12 months is impossible, even
 *    playing perfectly.
 *
 * The second lock is the one that guarantees the duration: it rewards regularity rather than
 * grinding, and leaves the player free to play a lot or a little on any given day. The first keeps
 * levelling up meaningful for almost the whole story.
 */

/** Energy: one exploration costs one point, a dungeon costs more. */
export const ADVENTURE_ENERGY_MAX = 20;
export const ADVENTURE_ENERGY_REGEN_MS = 45 * 60_000;
export const ADVENTURE_ENERGY_PER_EXPLORE = 1;
export const ADVENTURE_ENERGY_PER_DUNGEON = 6;

/** Health: out of combat regeneration, as a share of the maximum (about 2 h 15 for a full bar). */
export const ADVENTURE_HP_REGEN_MS = 4 * 60_000;
export const ADVENTURE_HP_REGEN_RATIO = 0.03;
/** Below this share of health, the player has to heal before exploring again. */
export const ADVENTURE_HP_EXPLORE_THRESHOLD = 0.15;

export const ADVENTURE_MAX_LEVEL = 100;
/** Stat points granted on each level up, spent through the adventure `upgrade` subcommand. */
export const ADVENTURE_STAT_POINTS_PER_LEVEL = 3;

/**
 * Experience needed to go from `level` to the next one. The curve is deliberately gentle at the
 * start (the first levels fall in a few explorations) and long at the end (about 5 days of steady
 * play for level 100), without ever turning into a wall.
 */
export function adventureXpToNextLevel(level: number): number {
  if (level >= ADVENTURE_MAX_LEVEL) return 0;
  return Math.round(63 * level ** 1.45 + 30);
}

/** Experience of a successful exploration, before the zone bonus and the random spread. */
export function adventureBaseExploreXp(level: number): number {
  return Math.round(14 + 2.6 * level);
}

/** Base gold of a successful exploration, before the zone bonus and the random spread. */
export function adventureBaseExploreGold(level: number): number {
  return Math.round(8 + 1.6 * level);
}

/** Echo shards granted by the time based milestones of the game. */
export const ADVENTURE_ECHOES_PER_DAILY_SET = 1;
export const ADVENTURE_ECHOES_PER_WEEKLY_SET = 2;
export const ADVENTURE_ECHOES_PER_DUNGEON = 3;
/** Chance that an exploration reveals a lost echo: around 1.8 a week for a heavy player. */
export const ADVENTURE_ECHO_FIND_CHANCE = 0.008;

/** One dungeon a week: the appointment that paces the story. */
export const ADVENTURE_DUNGEON_COOLDOWN_MS = 7 * 24 * 3_600_000;

/** Loot bonus granted by the streak of consecutive days, capped so it stays reachable. */
export const ADVENTURE_STREAK_BONUS_PER_DAY = 0.02;
export const ADVENTURE_STREAK_BONUS_MAX = 0.3;

/** Short cooldown between explorations: it paces the reading without ever blocking a session. */
export const ADVENTURE_EXPLORE_COOLDOWN_SECONDS = 8;

/** Progression after an experience gain, side effect free: shared by the bot and the API. */
export interface AdventureXpResult {
  level: number;
  xp: number;
  totalXp: number;
  statPoints: number;
  levelsGained: number;
}

/**
 * Applies an experience gain and chains the level ups. The admin panel uses it to grant experience
 * exactly the way the game hands it out.
 */
export function applyAdventureXp(
  current: { level: number; xp: number; totalXp: number; statPoints: number },
  amount: number,
): AdventureXpResult {
  let { level, xp, statPoints } = current;
  let levelsGained = 0;

  xp += Math.max(0, amount);

  while (level < ADVENTURE_MAX_LEVEL) {
    const needed = adventureXpToNextLevel(level);
    if (xp < needed) break;
    xp -= needed;
    level += 1;
    statPoints += ADVENTURE_STAT_POINTS_PER_LEVEL;
    levelsGained += 1;
  }

  // At the maximum level the leftover experience is no longer kept in the bar.
  if (level >= ADVENTURE_MAX_LEVEL) xp = 0;

  return { level, xp, totalXp: current.totalXp + Math.max(0, amount), statPoints, levelsGained };
}
