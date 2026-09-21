import type { AdventureCharacter, AdventureTrade, Prisma } from "@prisma/client";

import { prisma } from "../client";
import type { AdventureTradeItems } from "../schemas/adventure";

export interface CreateTradeInput {
  initiatorId: string;
  targetId: string;
  offeredItems: AdventureTradeItems;
  offeredGold: number;
  requestedItems: AdventureTradeItems;
  requestedGold: number;
  channelId: string | null;
  expiresAt: Date;
}

/** An offer with both characters, so names can be shown instead of ids. */
export type AdventureTradeWithParties = AdventureTrade & {
  initiator: AdventureCharacter;
  target: AdventureCharacter;
};

const WITH_PARTIES = { initiator: true, target: true } as const;

export async function createAdventureTrade(input: CreateTradeInput): Promise<AdventureTrade> {
  const { offeredItems, requestedItems, ...rest } = input;
  return prisma.adventureTrade.create({
    data: {
      ...rest,
      offeredItems: offeredItems as unknown as Prisma.InputJsonValue,
      requestedItems: requestedItems as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function getAdventureTrade(id: number): Promise<AdventureTradeWithParties | null> {
  return prisma.adventureTrade.findUnique({ where: { id }, include: WITH_PARTIES });
}

/** Offers still open for a player, whether sent or received. */
export async function listPendingAdventureTrades(
  userId: string,
  now = new Date(),
): Promise<AdventureTradeWithParties[]> {
  return prisma.adventureTrade.findMany({
    where: {
      status: "PENDING",
      expiresAt: { gt: now },
      OR: [{ initiatorId: userId }, { targetId: userId }],
    },
    include: WITH_PARTIES,
    orderBy: { createdAt: "desc" },
  });
}

export async function countPendingAdventureTrades(
  initiatorId: string,
  now = new Date(),
): Promise<number> {
  return prisma.adventureTrade.count({
    where: { initiatorId, status: "PENDING", expiresAt: { gt: now } },
  });
}

/**
 * Resolves an offer only while it is still pending: the `status: "PENDING"` condition inside the
 * `updateMany` acts as a lock against a double click or both players answering at once.
 */
export async function resolveAdventureTrade(
  id: number,
  status: "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED",
): Promise<boolean> {
  const { count } = await prisma.adventureTrade.updateMany({
    where: { id, status: "PENDING" },
    data: { status, resolvedAt: new Date() },
  });
  return count > 0;
}

/**
 * Runs the whole swap in a single transaction: without it, a failure midway would leave one player
 * stripped and the other empty-handed.
 */
export async function applyAdventureTrade(operations: {
  tradeId: number;
  initiatorId: string;
  targetId: string;
  initiatorGoldDelta: number;
  targetGoldDelta: number;
  /** Removals first, additions after: the same item can move from one bag to the other. */
  removals: { userId: string; itemId: string; quantity: number }[];
  additions: { userId: string; itemId: string; quantity: number }[];
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const removal of operations.removals) {
      const row = await tx.adventureItem.findUnique({
        where: { userId_itemId: { userId: removal.userId, itemId: removal.itemId } },
      });
      if (!row || row.quantity < removal.quantity) {
        throw new Error(`Missing item during trade: ${removal.itemId}`);
      }
      if (row.quantity === removal.quantity) {
        await tx.adventureItem.delete({ where: { id: row.id } });
      } else {
        await tx.adventureItem.update({
          where: { id: row.id },
          data: { quantity: { decrement: removal.quantity } },
        });
      }
    }

    for (const addition of operations.additions) {
      await tx.adventureItem.upsert({
        where: { userId_itemId: { userId: addition.userId, itemId: addition.itemId } },
        update: { quantity: { increment: addition.quantity } },
        create: {
          userId: addition.userId,
          itemId: addition.itemId,
          quantity: addition.quantity,
        },
      });
    }

    await tx.adventureCharacter.update({
      where: { userId: operations.initiatorId },
      data: { gold: { increment: operations.initiatorGoldDelta }, trades: { increment: 1 } },
    });
    await tx.adventureCharacter.update({
      where: { userId: operations.targetId },
      data: { gold: { increment: operations.targetGoldDelta }, trades: { increment: 1 } },
    });
    await tx.adventureTrade.update({
      where: { id: operations.tradeId },
      data: { status: "ACCEPTED", resolvedAt: new Date() },
    });
  });
}

/** Marks offers past their deadline as expired (called before each listing). */
export async function expireAdventureTrades(now = new Date()): Promise<number> {
  const { count } = await prisma.adventureTrade.updateMany({
    where: { status: "PENDING", expiresAt: { lte: now } },
    data: { status: "EXPIRED", resolvedAt: now },
  });
  return count;
}

/** Purges resolved offers; called by the API retention job. */
export async function deleteAdventureTradesBefore(cutoff: Date): Promise<number> {
  const { count } = await prisma.adventureTrade.deleteMany({
    where: { status: { not: "PENDING" }, createdAt: { lt: cutoff } },
  });
  return count;
}
