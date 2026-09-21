import type { AdventureQuest, AdventureQuestKind } from "@prisma/client";

import { prisma } from "../client";

export interface QuestDraft {
  questId: string;
  target: number;
}

/** Quest batch of a period (UTC day or week), in draw order. */
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

/** Creates the period batch. `skipDuplicates` covers two commands racing. */
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
 * Advances the running quests tracking a game event (`questIds`: those whose objective matches).
 * A claimed quest is no longer incremented, to keep `progress` readable.
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

/** Purges batches older than a cutoff; called by the API retention job. */
export async function deleteAdventureQuestsBefore(cutoff: Date): Promise<number> {
  const { count } = await prisma.adventureQuest.deleteMany({
    where: { periodStart: { lt: cutoff } },
  });
  return count;
}
