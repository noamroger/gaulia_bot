import type {
  AdventureAchievement,
  AdventureCharacter,
  AdventureClass,
  AdventureItem,
  AdventureLog,
  AdventureLogType,
  Prisma,
} from "@prisma/client";

import { prisma } from "../client";
import type { ChapterProgress } from "../schemas/adventure";

/** Editable character fields: everything but the key and the automatic timestamps. */
export type AdventureCharacterPatch = Partial<
  Omit<AdventureCharacter, "userId" | "createdAt" | "updatedAt" | "chapterProgress">
> & { chapterProgress?: ChapterProgress };

export interface CreateCharacterInput {
  userId: string;
  username: string | null;
  characterClass: AdventureClass;
  hp: number;
  energy: number;
}

function toUpdateData(
  patch: AdventureCharacterPatch,
): Prisma.AdventureCharacterUncheckedUpdateInput {
  const { chapterProgress, ...rest } = patch;
  return chapterProgress === undefined
    ? rest
    : { ...rest, chapterProgress: chapterProgress as Prisma.InputJsonValue };
}

export async function getAdventureCharacter(userId: string): Promise<AdventureCharacter | null> {
  return prisma.adventureCharacter.findUnique({ where: { userId } });
}

export async function createAdventureCharacter(
  input: CreateCharacterInput,
): Promise<AdventureCharacter> {
  return prisma.adventureCharacter.create({ data: input });
}

export async function updateAdventureCharacter(
  userId: string,
  patch: AdventureCharacterPatch,
): Promise<AdventureCharacter> {
  return prisma.adventureCharacter.update({ where: { userId }, data: toUpdateData(patch) });
}

/** Global leaderboard: level, then total xp. */
export async function listTopAdventurers(limit: number): Promise<AdventureCharacter[]> {
  return prisma.adventureCharacter.findMany({
    orderBy: [{ level: "desc" }, { totalXp: "desc" }],
    take: limit,
  });
}

/** Player rank (1 = first), using the leaderboard order. */
export async function getAdventureRank(character: AdventureCharacter): Promise<number> {
  const ahead = await prisma.adventureCharacter.count({
    where: {
      OR: [
        { level: { gt: character.level } },
        { level: character.level, totalXp: { gt: character.totalXp } },
      ],
    },
  });
  return ahead + 1;
}

export async function listAdventureItems(userId: string): Promise<AdventureItem[]> {
  return prisma.adventureItem.findMany({ where: { userId }, orderBy: { itemId: "asc" } });
}

/** Adds (or stacks) an item and returns the resulting inventory row. */
export async function addAdventureItem(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<AdventureItem> {
  return prisma.adventureItem.upsert({
    where: { userId_itemId: { userId, itemId } },
    update: { quantity: { increment: quantity } },
    create: { userId, itemId, quantity },
  });
}

/** Raises the upgrade tier of the player's copy by one step. */
export async function upgradeAdventureItem(
  userId: string,
  itemId: string,
  upgradeLevel: number,
): Promise<AdventureItem> {
  return prisma.adventureItem.update({
    where: { userId_itemId: { userId, itemId } },
    data: { upgradeLevel },
  });
}

/**
 * Removes copies of an item. Returns false without writing anything when the inventory is short,
 * which guards purchases, crafts and consumables.
 */
export async function removeAdventureItem(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<boolean> {
  const row = await prisma.adventureItem.findUnique({
    where: { userId_itemId: { userId, itemId } },
  });
  if (!row || row.quantity < quantity) return false;

  if (row.quantity === quantity) {
    await prisma.adventureItem.delete({ where: { id: row.id } });
  } else {
    await prisma.adventureItem.update({
      where: { id: row.id },
      data: { quantity: { decrement: quantity } },
    });
  }
  return true;
}

/** Equips a piece and unequips every other one in the same slot at once. */
export async function equipAdventureItem(
  userId: string,
  itemId: string,
  slotItemIds: string[],
): Promise<void> {
  await prisma.$transaction([
    prisma.adventureItem.updateMany({
      where: { userId, itemId: { in: slotItemIds } },
      data: { equipped: false },
    }),
    prisma.adventureItem.updateMany({ where: { userId, itemId }, data: { equipped: true } }),
  ]);
}

export async function unequipAdventureItem(userId: string, itemId: string): Promise<void> {
  await prisma.adventureItem.updateMany({ where: { userId, itemId }, data: { equipped: false } });
}

export async function listAdventureAchievements(userId: string): Promise<AdventureAchievement[]> {
  return prisma.adventureAchievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: "asc" },
  });
}

/** Unlocks an achievement; false when it already was (nothing to announce again). */
export async function unlockAdventureAchievement(
  userId: string,
  achievementId: string,
): Promise<boolean> {
  const existing = await prisma.adventureAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId } },
  });
  if (existing) return false;

  await prisma.adventureAchievement.create({ data: { userId, achievementId } });
  return true;
}

export async function addAdventureLog(entry: {
  userId: string;
  type: AdventureLogType;
  message: string;
  actorId?: string | null;
}): Promise<AdventureLog> {
  return prisma.adventureLog.create({
    data: { ...entry, actorId: entry.actorId ?? null },
  });
}

export async function listAdventureLogs(userId: string, limit: number): Promise<AdventureLog[]> {
  return prisma.adventureLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
