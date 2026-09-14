import type { CreditAccount, CreditTransaction, CreditTransactionType } from "@prisma/client";

import { prisma } from "../client";

/** Crédits attribués à chaque vote sur top.gg. */
export const CREDITS_PER_VOTE = 10;

/** Solde maximum d'un compte : borne les ajustements admin et évite tout dépassement d'entier. */
export const MAX_CREDIT_BALANCE = 1_000_000;

export interface CreditAccountSummary {
  userId: string;
  username: string | null;
  avatar: string | null;
  balance: number;
  totalEarned: number;
  voteCount: number;
  lastVoteAt: Date | null;
  updatedAt: Date;
}

function toSummary(account: CreditAccount): CreditAccountSummary {
  return {
    userId: account.userId,
    username: account.username,
    avatar: account.avatar,
    balance: account.balance,
    totalEarned: account.totalEarned,
    voteCount: account.voteCount,
    lastVoteAt: account.lastVoteAt,
    updatedAt: account.updatedAt,
  };
}

/** Compte de crédits d'un utilisateur, ou un compte vide (non persisté) s'il n'a jamais voté. */
export async function getCreditAccount(userId: string): Promise<CreditAccountSummary> {
  const account = await prisma.creditAccount.findUnique({ where: { userId } });
  if (account) return toSummary(account);

  return {
    userId,
    username: null,
    avatar: null,
    balance: 0,
    totalEarned: 0,
    voteCount: 0,
    lastVoteAt: null,
    updatedAt: new Date(0),
  };
}

export async function listCreditTransactions(
  userId: string,
  limit = 20,
): Promise<CreditTransaction[]> {
  return prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Tous les comptes ayant déjà eu une activité, du plus gros solde au plus petit (panel admin). */
export async function listCreditAccounts(): Promise<CreditAccountSummary[]> {
  const accounts = await prisma.creditAccount.findMany({
    orderBy: [{ balance: "desc" }, { updatedAt: "desc" }],
  });
  return accounts.map(toSummary);
}

export interface RecordVoteInput {
  /** Identifiant du vote fourni par top.gg : garantit l'idempotence en cas de nouvelle livraison. */
  voteId: string;
  userId: string;
  username?: string | null | undefined;
  avatar?: string | null | undefined;
  weight: number;
  votedAt: Date;
}

export interface RecordVoteResult {
  /** Faux si ce vote avait déjà été traité : aucun crédit n'a été ajouté. */
  credited: boolean;
  balance: number;
}

/**
 * Crédite un vote top.gg. L'insertion du vote et l'ajout des crédits sont dans la même transaction :
 * si le vote existe déjà (nouvelle tentative de livraison du webhook), rien n'est crédité.
 */
export async function recordVote(input: RecordVoteInput): Promise<RecordVoteResult> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.topggVote.findUnique({ where: { id: input.voteId } });
    if (existing) {
      const account = await tx.creditAccount.findUnique({ where: { userId: input.userId } });
      return { credited: false, balance: account?.balance ?? 0 };
    }

    await tx.topggVote.create({
      data: {
        id: input.voteId,
        userId: input.userId,
        weight: input.weight,
        votedAt: input.votedAt,
      },
    });

    const identity = {
      ...(input.username ? { username: input.username } : {}),
      ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
    };

    const account = await tx.creditAccount.upsert({
      where: { userId: input.userId },
      update: {
        ...identity,
        balance: { increment: CREDITS_PER_VOTE },
        totalEarned: { increment: CREDITS_PER_VOTE },
        voteCount: { increment: 1 },
        lastVoteAt: input.votedAt,
      },
      create: {
        userId: input.userId,
        ...identity,
        balance: CREDITS_PER_VOTE,
        totalEarned: CREDITS_PER_VOTE,
        voteCount: 1,
        lastVoteAt: input.votedAt,
      },
    });

    await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: "VOTE",
        amount: CREDITS_PER_VOTE,
        balanceAfter: account.balance,
        reason: "Vote sur top.gg",
      },
    });

    return { credited: true, balance: account.balance };
  });
}

export interface SpendCreditsInput {
  userId: string;
  amount: number;
  guildId: string;
  reason: string;
  type?: CreditTransactionType | undefined;
}

export interface SpendCreditsResult {
  /** Faux si le solde était insuffisant : rien n'a été débité. */
  spent: boolean;
  balance: number;
}

/**
 * Débite un compte si (et seulement si) son solde le permet. Le `updateMany` conditionné sur
 * `balance >= amount` rend l'opération atomique : deux échanges simultanés ne peuvent pas passer
 * le solde en négatif.
 */
export async function spendCredits(input: SpendCreditsInput): Promise<SpendCreditsResult> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.creditAccount.updateMany({
      where: { userId: input.userId, balance: { gte: input.amount } },
      data: { balance: { decrement: input.amount } },
    });

    if (updated.count === 0) {
      const account = await tx.creditAccount.findUnique({ where: { userId: input.userId } });
      return { spent: false, balance: account?.balance ?? 0 };
    }

    const account = await tx.creditAccount.findUniqueOrThrow({ where: { userId: input.userId } });

    await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: input.type ?? "PREMIUM_REDEEM",
        amount: -input.amount,
        balanceAfter: account.balance,
        guildId: input.guildId,
        reason: input.reason,
      },
    });

    return { spent: true, balance: account.balance };
  });
}

export interface AdjustCreditsInput {
  userId: string;
  /** Variation à appliquer (négative pour un retrait). */
  delta: number;
  /** Identifiant du propriétaire du bot à l'origine de l'ajustement. */
  actorId: string;
  reason?: string | null | undefined;
}

/**
 * Ajustement manuel depuis le panel admin. Le solde est borné à [0, MAX_CREDIT_BALANCE] : retirer
 * plus que le solde le ramène à 0 plutôt que d'échouer. La variation réellement appliquée est
 * journalisée, pas celle demandée.
 */
export async function adjustCredits(input: AdjustCreditsInput): Promise<CreditAccountSummary> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.creditAccount.findUnique({ where: { userId: input.userId } });
    const previousBalance = current?.balance ?? 0;
    const nextBalance = Math.min(MAX_CREDIT_BALANCE, Math.max(0, previousBalance + input.delta));
    const applied = nextBalance - previousBalance;

    const account = await tx.creditAccount.upsert({
      where: { userId: input.userId },
      update: {
        balance: nextBalance,
        ...(applied > 0 ? { totalEarned: { increment: applied } } : {}),
      },
      create: {
        userId: input.userId,
        balance: nextBalance,
        totalEarned: Math.max(0, applied),
      },
    });

    if (applied !== 0) {
      await tx.creditTransaction.create({
        data: {
          userId: input.userId,
          type: "ADMIN_ADJUST",
          amount: applied,
          balanceAfter: account.balance,
          actorId: input.actorId,
          reason: input.reason ?? null,
        },
      });
    }

    return toSummary(account);
  });
}

/** Annule un débit quand l'action payée a échoué juste après (ex: octroi du premium en erreur). */
export async function refundCredits(input: {
  userId: string;
  amount: number;
  guildId: string;
  reason: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const account = await tx.creditAccount.update({
      where: { userId: input.userId },
      data: { balance: { increment: input.amount } },
    });

    await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: "PREMIUM_REDEEM",
        amount: input.amount,
        balanceAfter: account.balance,
        guildId: input.guildId,
        reason: input.reason,
      },
    });
  });
}
