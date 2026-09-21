import type {
  AdventureAchievement,
  AdventureCharacter,
  AdventureItem,
  AdventureLog,
  AdventureQuest,
} from "@prisma/client";

import { prisma } from "../client";

const PLAYER_LOG_LIMIT = 30;
const PLAYER_QUEST_LIMIT = 20;

export interface AdventurePlayerSummary {
  userId: string;
  username: string | null;
  characterClass: AdventureCharacter["characterClass"];
  level: number;
  totalXp: number;
  gold: number;
  echoes: number;
  actIndex: number;
  chapterIndex: number;
  storyEndedAt: Date | null;
  explorations: number;
  dungeonClears: number;
  lastPlayedAt: Date | null;
  createdAt: Date;
}

export interface AdventurePlayerDetail {
  character: AdventureCharacter;
  items: AdventureItem[];
  quests: AdventureQuest[];
  achievements: AdventureAchievement[];
  logs: AdventureLog[];
}

/** Every character, most advanced first: the admin panel list. */
export async function listAdventurePlayers(): Promise<AdventurePlayerSummary[]> {
  return prisma.adventureCharacter.findMany({
    orderBy: [{ actIndex: "desc" }, { chapterIndex: "desc" }, { level: "desc" }],
    select: {
      userId: true,
      username: true,
      characterClass: true,
      level: true,
      totalXp: true,
      gold: true,
      echoes: true,
      actIndex: true,
      chapterIndex: true,
      storyEndedAt: true,
      explorations: true,
      dungeonClears: true,
      lastPlayedAt: true,
      createdAt: true,
    },
  });
}

/** Full player record for the admin panel (character, inventory, quests, logs). */
export async function getAdventurePlayerDetail(
  userId: string,
): Promise<AdventurePlayerDetail | null> {
  const character = await prisma.adventureCharacter.findUnique({ where: { userId } });
  if (!character) return null;

  const [items, quests, achievements, logs] = await Promise.all([
    prisma.adventureItem.findMany({ where: { userId }, orderBy: { itemId: "asc" } }),
    prisma.adventureQuest.findMany({
      where: { userId },
      orderBy: [{ periodStart: "desc" }, { id: "asc" }],
      take: PLAYER_QUEST_LIMIT,
    }),
    prisma.adventureAchievement.findMany({ where: { userId }, orderBy: { unlockedAt: "asc" } }),
    prisma.adventureLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: PLAYER_LOG_LIMIT,
    }),
  ]);

  return { character, items, quests, achievements, logs };
}

export async function countAdventureCharacters(userId: string): Promise<number> {
  return prisma.adventureCharacter.count({ where: { userId } });
}
