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

/** Outcome of `applyAdventureTrade`: anything but `applied` means nothing moved. */
export type ApplyTradeOutcome = "applied" | "alreadyHandled" | "missingItems" | "missingGold";

/** Thrown inside the transaction to roll it back, then turned into an outcome. */
class TradeAborted extends Error {
  constructor(readonly outcome: Exclude<ApplyTradeOutcome, "applied">) {
    super(outcome);
  }
}

/**
 * Runs the whole swap in a single transaction: without it, a failure midway would leave one player
 * stripped and the other empty-handed.
 *
 * Every write is guarded by its own condition rather than by what was read before: the offer must
 * still be pending (a double click on "accept" would otherwise run the swap twice), and each bag and
 * purse must still hold what leaves it (the players keep playing while the offer is open).
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
}): Promise<ApplyTradeOutcome> {
  try {
    await prisma.$transaction(async (tx) => {
      // First write of the transaction: the row lock it takes makes a concurrent acceptance wait,
      // then find the offer already resolved.
      const claimed = await tx.adventureTrade.updateMany({
        where: { id: operations.tradeId, status: "PENDING" },
        data: { status: "ACCEPTED", resolvedAt: new Date() },
      });
      if (claimed.count === 0) throw new TradeAborted("alreadyHandled");

      for (const removal of operations.removals) {
        const where = { userId: removal.userId, itemId: removal.itemId };
        const taken = await tx.adventureItem.updateMany({
          where: { ...where, quantity: { gte: removal.quantity } },
          data: { quantity: { decrement: removal.quantity } },
        });
        if (taken.count === 0) throw new TradeAborted("missingItems");
        await tx.adventureItem.deleteMany({ where: { ...where, quantity: { lte: 0 } } });
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

      for (const [userId, delta] of [
        [operations.initiatorId, operations.initiatorGoldDelta],
        [operations.targetId, operations.targetGoldDelta],
      ] as const) {
        const paid = await tx.adventureCharacter.updateMany({
          where: { userId, ...(delta < 0 ? { gold: { gte: -delta } } : {}) },
          data: { gold: { increment: delta }, trades: { increment: 1 } },
        });
        if (paid.count === 0) throw new TradeAborted("missingGold");
      }
    });
    return "applied";
  } catch (error) {
    if (error instanceof TradeAborted) return error.outcome;
    throw error;
  }
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
