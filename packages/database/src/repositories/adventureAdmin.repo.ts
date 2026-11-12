import type {
  AdventureAchievement,
  AdventureCharacter,
  AdventureItem,
  AdventureLog,
  AdventureQuest,
} from "@prisma/client";

import { prisma } from "../client";
import { ADVENTURE_ENERGY_MAX, applyAdventureXp } from "../data/adventurePacing";
import { ADVENTURE_MAX_ECHOES, ADVENTURE_MAX_GOLD } from "../schemas/adventure";
import { takeItemsInTransaction } from "./adventureCharacter.repo";

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

/** Owner intervention: deltas, except `level` which sets the level outright. */
export interface AdventureIntervention {
  xp?: number;
  gold?: number;
  echoes?: number;
  energy?: number;
  statPoints?: number;
  level?: number;
  /** Positive quantity gives items, negative takes them out of the bag. */
  items?: { itemId: string; quantity: number }[];
}

export type AdventureInterventionOutcome = "applied" | "noCharacter" | "missingItems";

class InterventionAborted extends Error {
  constructor(readonly outcome: Exclude<AdventureInterventionOutcome, "applied">) {
    super(outcome);
  }
}

function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, value));
}

/**
 * Applies an owner intervention all or nothing. The character row is locked and read again inside
 * the transaction, so the deltas land on the current values instead of a snapshot taken before the
 * request, and a removal larger than the bag cancels the whole intervention.
 */
export async function applyAdventureIntervention(
  userId: string,
  intervention: AdventureIntervention,
  log: { message: string; actorId: string },
): Promise<AdventureInterventionOutcome> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "adventure_characters" WHERE "userId" = ${userId} FOR UPDATE`;
      const character = await tx.adventureCharacter.findUnique({ where: { userId } });
      if (!character) throw new InterventionAborted("noCharacter");

      // XP goes through the same rule as the game, so levels rise exactly as they do in play.
      const progression = applyAdventureXp(character, intervention.xp ?? 0);
      await tx.adventureCharacter.update({
        where: { userId },
        data: {
          level: intervention.level ?? progression.level,
          xp: intervention.level !== undefined ? 0 : progression.xp,
          totalXp: progression.totalXp,
          statPoints: Math.max(0, progression.statPoints + (intervention.statPoints ?? 0)),
          gold: clamp(character.gold + (intervention.gold ?? 0), ADVENTURE_MAX_GOLD),
          echoes: clamp(character.echoes + (intervention.echoes ?? 0), ADVENTURE_MAX_ECHOES),
          energy: clamp(character.energy + (intervention.energy ?? 0), ADVENTURE_ENERGY_MAX),
        },
      });

      const entries = intervention.items ?? [];
      const removals = entries
        .filter((entry) => entry.quantity < 0)
        .map((entry) => ({ userId, itemId: entry.itemId, quantity: -entry.quantity }));
      if (!(await takeItemsInTransaction(tx, removals))) {
        throw new InterventionAborted("missingItems");
      }

      for (const entry of entries.filter((item) => item.quantity > 0)) {
        // Create-if-missing then increment: an upsert is a read then an insert in Prisma.
        await tx.adventureItem.createMany({
          data: [{ userId, itemId: entry.itemId, quantity: 0 }],
          skipDuplicates: true,
        });
        await tx.adventureItem.update({
          where: { userId_itemId: { userId, itemId: entry.itemId } },
          data: { quantity: { increment: entry.quantity } },
        });
      }

      await tx.adventureLog.create({
        data: { userId, type: "ADMIN", message: log.message, actorId: log.actorId },
      });
    });
    return "applied";
  } catch (error) {
    if (error instanceof InterventionAborted) return error.outcome;
    throw error;
  }
}
