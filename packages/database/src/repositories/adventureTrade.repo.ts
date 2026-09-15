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

/** Une proposition avec les deux personnages concernés, pour afficher des noms plutôt que des ID. */
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

/** Propositions encore ouvertes concernant un joueur, qu'il les ait faites ou reçues. */
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
 * Change l'état d'une proposition, à condition qu'elle soit encore en attente : la condition
 * `status: "PENDING"` dans le `updateMany` sert de verrou contre un double clic ou deux joueurs
 * qui répondent en même temps.
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
 * Exécute l'échange dans une seule transaction : sans elle, une erreur au milieu laisserait un
 * joueur délesté et l'autre les mains vides.
 */
export async function applyAdventureTrade(operations: {
  tradeId: number;
  initiatorId: string;
  targetId: string;
  initiatorGoldDelta: number;
  targetGoldDelta: number;
  /** Retraits d'abord, ajouts ensuite : un même objet peut passer d'un sac à l'autre. */
  removals: { userId: string; itemId: string; quantity: number }[];
  additions: { userId: string; itemId: string; quantity: number }[];
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const removal of operations.removals) {
      const row = await tx.adventureItem.findUnique({
        where: { userId_itemId: { userId: removal.userId, itemId: removal.itemId } },
      });
      if (!row || row.quantity < removal.quantity) {
        throw new Error(`Objet manquant pendant l'échange : ${removal.itemId}`);
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

/** Marque expirées les propositions dont le délai est passé (appelé avant chaque affichage). */
export async function expireAdventureTrades(now = new Date()): Promise<number> {
  const { count } = await prisma.adventureTrade.updateMany({
    where: { status: "PENDING", expiresAt: { lte: now } },
    data: { status: "EXPIRED", resolvedAt: now },
  });
  return count;
}

/** Purge des propositions terminées, appelée par le job de rétention de l'API. */
export async function deleteAdventureTradesBefore(cutoff: Date): Promise<number> {
  const { count } = await prisma.adventureTrade.deleteMany({
    where: { status: { not: "PENDING" }, createdAt: { lt: cutoff } },
  });
  return count;
}
