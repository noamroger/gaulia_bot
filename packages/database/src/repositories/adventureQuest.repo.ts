import type { AdventureQuest, AdventureQuestKind } from "@prisma/client";

import { prisma } from "../client";

export interface QuestDraft {
  questId: string;
  target: number;
}

/** Lot de quêtes d'une période (jour ou semaine UTC), dans l'ordre de tirage. */
export async function listAdventureQuests(
  userId: string,
  kind: AdventureQuestKind,
  periodStart: Date,
): Promise<AdventureQuest[]> {
  return prisma.adventureQuest.findMany({
    where: { userId, kind, periodStart },
    orderBy: { id: "asc" },
  });
}

/** Crée le lot de la période. `skipDuplicates` couvre deux commandes lancées en même temps. */
export async function createAdventureQuests(
  userId: string,
  kind: AdventureQuestKind,
  periodStart: Date,
  drafts: QuestDraft[],
): Promise<void> {
  await prisma.adventureQuest.createMany({
    data: drafts.map((draft) => ({ userId, kind, periodStart, ...draft })),
    skipDuplicates: true,
  });
}

/**
 * Avance les quêtes en cours qui suivent un évènement de jeu (`questIds` : celles dont l'objectif
 * correspond). Une quête déjà terminée n'est plus incrémentée, pour garder `progress` lisible.
 */
export async function advanceAdventureQuests(
  userId: string,
  periodStarts: { kind: AdventureQuestKind; periodStart: Date }[],
  questIds: string[],
  amount: number,
): Promise<void> {
  if (questIds.length === 0 || amount <= 0) return;

  await prisma.$transaction(
    periodStarts.map(({ kind, periodStart }) =>
      prisma.adventureQuest.updateMany({
        where: { userId, kind, periodStart, questId: { in: questIds }, claimedAt: null },
        data: { progress: { increment: amount } },
      }),
    ),
  );
}

export async function claimAdventureQuest(id: number): Promise<AdventureQuest> {
  return prisma.adventureQuest.update({ where: { id }, data: { claimedAt: new Date() } });
}

/** Purge des lots antérieurs à une date, appelée par le job de rétention de l'API. */
export async function deleteAdventureQuestsBefore(cutoff: Date): Promise<number> {
  const { count } = await prisma.adventureQuest.deleteMany({
    where: { periodStart: { lt: cutoff } },
  });
  return count;
}
