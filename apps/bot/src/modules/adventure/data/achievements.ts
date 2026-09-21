import type { AdventureCharacter } from "@gaulia/database";

import type { Translator } from "../../../i18n";

/**
 * Achievements. Each entry is evaluated against the character state after a game action, which
 * avoids any dedicated counter. Names and descriptions live in the catalog, keyed by `id`.
 */
export interface AchievementDefinition {
  id: string;
  emoji: string;
  /** True when the achievement also grants a title, shown on the character sheet. */
  grantsTitle?: boolean;
  unlocked: (character: AdventureCharacter) => boolean;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: "premier-pas",
    emoji: "👣",
    unlocked: (c) => c.explorations >= 1,
  },
  {
    id: "marcheur",
    emoji: "🥾",
    unlocked: (c) => c.explorations >= 100,
  },
  {
    id: "arpenteur",
    emoji: "🗺️",
    grantsTitle: true,
    unlocked: (c) => c.explorations >= 1_000,
  },
  {
    id: "infatigable",
    emoji: "♾️",
    grantsTitle: true,
    unlocked: (c) => c.explorations >= 5_000,
  },
  {
    id: "premier-sang",
    emoji: "🩸",
    unlocked: (c) => c.victories >= 1,
  },
  {
    id: "chasseur",
    emoji: "🏹",
    unlocked: (c) => c.victories >= 250,
  },
  {
    id: "fleau",
    emoji: "⚔️",
    grantsTitle: true,
    unlocked: (c) => c.victories >= 2_500,
  },
  {
    id: "tombe-debout",
    emoji: "🤕",
    unlocked: (c) => c.defeats >= 1,
  },
  {
    id: "niveau-10",
    emoji: "🔟",
    unlocked: (c) => c.level >= 10,
  },
  {
    id: "niveau-25",
    emoji: "🎖️",
    unlocked: (c) => c.level >= 25,
  },
  {
    id: "niveau-50",
    emoji: "🏅",
    grantsTitle: true,
    unlocked: (c) => c.level >= 50,
  },
  {
    id: "niveau-75",
    emoji: "🌟",
    unlocked: (c) => c.level >= 75,
  },
  {
    id: "niveau-100",
    emoji: "👑",
    grantsTitle: true,
    unlocked: (c) => c.level >= 100,
  },
  {
    id: "premier-donjon",
    emoji: "🚪",
    unlocked: (c) => c.dungeonClears >= 1,
  },
  {
    id: "donjons-10",
    emoji: "🕯️",
    unlocked: (c) => c.dungeonClears >= 10,
  },
  {
    id: "donjons-30",
    emoji: "🗝️",
    grantsTitle: true,
    unlocked: (c) => c.dungeonClears >= 30,
  },
  {
    id: "serie-7",
    emoji: "📅",
    unlocked: (c) => c.bestStreak >= 7,
  },
  {
    id: "serie-30",
    emoji: "🗓️",
    unlocked: (c) => c.bestStreak >= 30,
  },
  {
    id: "serie-180",
    emoji: "🔥",
    grantsTitle: true,
    unlocked: (c) => c.bestStreak >= 180,
  },
  {
    id: "riche",
    emoji: "💰",
    unlocked: (c) => c.gold >= 100_000,
  },
  {
    id: "acte-3",
    emoji: "⚒️",
    unlocked: (c) => c.actIndex >= 2,
  },
  {
    id: "acte-5",
    emoji: "🌊",
    unlocked: (c) => c.actIndex >= 4,
  },
  {
    id: "acte-7",
    emoji: "✨",
    grantsTitle: true,
    unlocked: (c) => c.actIndex >= 6,
  },
  {
    id: "forgeron",
    emoji: "🔨",
    unlocked: (c) => c.upgrades >= 1,
  },
  {
    id: "maitre-forge",
    emoji: "⚒️",
    grantsTitle: true,
    unlocked: (c) => c.upgrades >= 25,
  },
  {
    id: "marchand",
    emoji: "🤝",
    unlocked: (c) => c.trades >= 1,
  },
  {
    id: "caravanier",
    emoji: "🐪",
    grantsTitle: true,
    unlocked: (c) => c.trades >= 50,
  },
  {
    id: "fin",
    emoji: "🏆",
    grantsTitle: true,
    unlocked: (c) => c.storyEndedAt !== null,
  },
] as const;

export function findAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}

export function achievementName(t: Translator, id: string): string {
  return t(`adventure.achievements.${id}.name`);
}

export function achievementDescription(t: Translator, id: string): string {
  return t(`adventure.achievements.${id}.description`);
}

/** Title granted by an achievement, or null when it grants none. */
export function achievementTitle(t: Translator, id: string): string | null {
  const key = `adventure.achievements.${id}.title`;
  return t.has(key) ? t(key) : null;
}
