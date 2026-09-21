import type { CreditAccount, CreditTransaction, CreditTransactionType } from "@prisma/client";

import { prisma } from "../client";

/** Credits granted for each top.gg vote. */
export const CREDITS_PER_VOTE = 10;

/** Account balance cap: bounds admin adjustments and avoids any integer overflow. */
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

/** A user's credit account, or an empty (unsaved) one when they never voted. */
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

/** Every account with some activity, largest balance first (admin panel). */
export async function listCreditAccounts(): Promise<CreditAccountSummary[]> {
  const accounts = await prisma.creditAccount.findMany({
    orderBy: [{ balance: "desc" }, { updatedAt: "desc" }],
  });
  return accounts.map(toSummary);
}

export interface RecordVoteInput {
  /** Vote id provided by top.gg: makes a redelivered webhook idempotent. */
  voteId: string;
  userId: string;
  username?: string | null | undefined;
  avatar?: string | null | undefined;
  weight: number;
  votedAt: Date;
}

export interface RecordVoteResult {
  /** False when the vote was already processed: nothing was credited. */
  credited: boolean;
  balance: number;
}

/**
 * Credits a top.gg vote. The vote insert and the credit grant share one transaction: if the vote
 * already exists (webhook redelivery), nothing is credited.
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
        reason: "top.gg vote",
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
  /** False when the balance was too low: nothing was debited. */
  spent: boolean;
  balance: number;
}

/**
 * Debits an account if (and only if) its balance allows it. The `updateMany` guarded by
 * `balance >= amount` makes the operation atomic: two concurrent spends cannot go negative.
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
  /** Delta to apply (negative to remove credits). */
  delta: number;
  /** Bot owner behind the adjustment. */
  actorId: string;
  reason?: string | null | undefined;
}

/**
 * Manual adjustment from the admin panel. The balance is clamped to [0, MAX_CREDIT_BALANCE], so
 * removing more than the balance lands on 0 instead of failing. The delta actually applied is
 * logged, not the requested one.
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

/** Reverses a debit when the paid action failed right after (e.g. a premium grant error). */
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
