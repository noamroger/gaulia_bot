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

/** Champs modifiables d'un personnage : tout sauf sa clé et ses horodatages automatiques. */
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

/** Classement global : niveau puis expérience totale, comme affiché par `/aventure classement`. */
export async function listTopAdventurers(limit: number): Promise<AdventureCharacter[]> {
  return prisma.adventureCharacter.findMany({
    orderBy: [{ level: "desc" }, { totalXp: "desc" }],
    take: limit,
  });
}

/** Rang d'un joueur (1 = premier), calculé avec le même ordre que le classement. */
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

/** Ajoute (ou empile) un objet et retourne la ligne d'inventaire résultante. */
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

/**
 * Retire des exemplaires d'un objet. Retourne faux — sans rien modifier — si l'inventaire n'en
 * contient pas assez, ce qui sert de garde-fou aux achats, crafts et consommations.
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

/** Équipe une pièce et déséquipe d'un même geste toutes celles du même emplacement. */
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

/** Débloque un haut fait ; retourne faux s'il l'était déjà (aucune annonce à refaire au joueur). */
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
