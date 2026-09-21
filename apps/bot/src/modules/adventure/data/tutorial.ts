import {
  ADVENTURE_DUNGEON_COOLDOWN_MS,
  ADVENTURE_ECHOES_PER_DAILY_SET,
  ADVENTURE_ECHOES_PER_DUNGEON,
  ADVENTURE_ECHOES_PER_WEEKLY_SET,
  ADVENTURE_ENERGY_MAX,
  ADVENTURE_ENERGY_PER_DUNGEON,
  ADVENTURE_ENERGY_PER_EXPLORE,
  ADVENTURE_ENERGY_REGEN_MS,
  ADVENTURE_MAX_LEVEL,
  ADVENTURE_MAX_PENDING_TRADES,
  ADVENTURE_MAX_UPGRADE,
  ADVENTURE_STAT_POINTS_PER_LEVEL,
  ADVENTURE_TOTAL_CHAPTERS,
  ADVENTURE_TRADE_EXPIRY_MS,
  ADVENTURE_TRADE_MAX_ITEMS,
  ADVENTURE_TRADE_MIN_LEVEL,
  ADVENTURE_UPGRADE_STEP,
} from "@gaulia/database";

import type { TranslationVars, Translator } from "../../../i18n";
import { CLASSES, classDescription, className, classPassive } from "./classes";
import { ACTS } from "./story";

/**
 * Layout of the tutorial (`/adventure tutorial`): the text itself lives in the catalog, this file
 * only holds the page order and the section keys.
 */
export interface TutorialPage {
  /** Stable id, used by the `topic` option and by the jump menu. */
  id: string;
  emoji: string;
  /** Catalog keys of the sections, in reading order. */
  sections: readonly string[];
}

export const TUTORIAL_PAGES: readonly TutorialPage[] = [
  { id: "basics", emoji: "🧭", sections: ["character", "exploring", "energy"] },
  { id: "progression", emoji: "📈", sections: ["levels", "gear", "upgrading"] },
  { id: "economy", emoji: "🪙", sections: ["gold", "counter", "forge"] },
  { id: "story", emoji: "📖", sections: ["acts", "shards", "dungeon", "quests"] },
  { id: "trading", emoji: "🤝", sections: ["offering", "rules", "bound", "tracking"] },
  { id: "community", emoji: "🏅", sections: ["compare", "where", "together"] },
  { id: "pace", emoji: "⏳", sections: ["duration", "habit", "tips"] },
] as const;

export const TUTORIAL_PAGE_IDS = TUTORIAL_PAGES.map((page) => page.id);

/** Page ids were French until the English rename: jump menus posted before it stay accurate. */
const LEGACY_PAGE_IDS: Readonly<Record<string, string>> = {
  bases: "basics",
  economie: "economy",
  scenario: "story",
  echanges: "trading",
  communaute: "community",
  rythme: "pace",
};

export function findTutorialPage(id: string): number {
  const wanted = Object.hasOwn(LEGACY_PAGE_IDS, id) ? LEGACY_PAGE_IDS[id]! : id;
  const index = TUTORIAL_PAGES.findIndex((page) => page.id === wanted);
  return index === -1 ? 0 : index;
}

/**
 * Numbers quoted by the tutorial are read from the balancing rather than copied, so tuning the
 * game keeps the text right on its own.
 */
export function tutorialVars(t: Translator): TranslationVars {
  const regenMinutes = Math.round(ADVENTURE_ENERGY_REGEN_MS / 60_000);

  return {
    classes: CLASSES.map((entry) =>
      t("adventure.tutorial.classLine", {
        emoji: entry.emoji,
        name: className(t, entry.id),
        description: classDescription(t, entry.id),
        passive: classPassive(t, entry.id),
      }),
    ).join("\n"),
    energyPerExplore: ADVENTURE_ENERGY_PER_EXPLORE,
    energyMax: ADVENTURE_ENERGY_MAX,
    regenMinutes,
    energyPerDay: Math.round((24 * 60) / regenMinutes),
    maxLevel: ADVENTURE_MAX_LEVEL,
    pointsPerLevel: ADVENTURE_STAT_POINTS_PER_LEVEL,
    maxUpgrade: ADVENTURE_MAX_UPGRADE,
    upgradePercent: Math.round(ADVENTURE_UPGRADE_STEP * 100),
    actCount: ACTS.length,
    chapterCount: ADVENTURE_TOTAL_CHAPTERS,
    perDaily: ADVENTURE_ECHOES_PER_DAILY_SET,
    perWeekly: ADVENTURE_ECHOES_PER_WEEKLY_SET,
    perDungeon: ADVENTURE_ECHOES_PER_DUNGEON,
    dungeonDays: Math.round(ADVENTURE_DUNGEON_COOLDOWN_MS / (24 * 3_600_000)),
    dungeonEnergy: ADVENTURE_ENERGY_PER_DUNGEON,
    minLevel: ADVENTURE_TRADE_MIN_LEVEL,
    expiryMinutes: Math.round(ADVENTURE_TRADE_EXPIRY_MS / 60_000),
    maxPending: ADVENTURE_MAX_PENDING_TRADES,
    maxItems: ADVENTURE_TRADE_MAX_ITEMS,
  };
}
