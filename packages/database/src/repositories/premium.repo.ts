import type { Guild, PremiumEntitlement } from "@prisma/client";

import { prisma } from "../client";
import { MAX_CREDIT_BALANCE } from "./credits.repo";

export interface UpsertEntitlementInput {
  id: string;
  skuId: string;
  guildId?: string | null | undefined;
  userId?: string | null | undefined;
  deleted?: boolean | undefined;
  startsAt?: Date | null | undefined;
  endsAt?: Date | null | undefined;
}

export async function upsertEntitlement(
  input: UpsertEntitlementInput,
): Promise<PremiumEntitlement> {
  const data = {
    skuId: input.skuId,
    guildId: input.guildId ?? null,
    userId: input.userId ?? null,
    deleted: input.deleted ?? false,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
  };

  return prisma.premiumEntitlement.upsert({
    where: { id: input.id },
    update: data,
    create: { id: input.id, ...data },
  });
}

export async function markEntitlementDeleted(id: string): Promise<void> {
  await prisma.premiumEntitlement.updateMany({
    where: { id },
    data: { deleted: true },
  });
}

export async function listActiveEntitlements(): Promise<PremiumEntitlement[]> {
  return prisma.premiumEntitlement.findMany({ where: { deleted: false } });
}

/**
 * Extends a guild's granted premium (credits redeemed). The new deadline starts from the running
 * one while it is still valid, so two redeems add up instead of overwriting each other.
 * Independent of `Guild.premium`, which reflects Discord entitlements.
 */
export async function grantGuildPremium(guildId: string, durationMs: number): Promise<Date> {
  const guild = await prisma.guild.upsert({
    where: { id: guildId },
    update: {},
    create: { id: guildId },
  });

  const now = Date.now();
  const running = guild.premiumGrantedUntil !== null && guild.premiumGrantedUntil.getTime() > now;
  const base = running ? guild.premiumGrantedUntil!.getTime() : now;
  const premiumGrantedUntil = new Date(base + durationMs);

  await prisma.guild.update({
    where: { id: guildId },
    data: {
      premiumGrantedUntil,
      // A running window keeps its start date: successive redeems form a single period, refundable
      // in one block pro rata (see refundUnusedGrantedPremium).
      ...(running && guild.premiumGrantedAt !== null ? {} : { premiumGrantedAt: new Date(now) }),
    },
  });
  return premiumGrantedUntil;
}

/** Sets (or clears, with `null`) the granted premium deadline - admin panel. */
export async function setGuildPremiumGrant(guildId: string, until: Date | null): Promise<Guild> {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: { premiumGrantedUntil: until },
    create: { id: guildId, premiumGrantedUntil: until },
  });
}

/** Guilds whose granted premium is still running, polled periodically by the bot. */
export async function listPremiumGrantedGuildIds(): Promise<string[]> {
  const guilds = await prisma.guild.findMany({
    where: { premiumGrantedUntil: { gt: new Date() } },
    select: { id: true },
  });
  return guilds.map((guild) => guild.id);
}

export type PremiumSourceKind = "SUBSCRIPTION" | "CREDITS";

export interface PremiumSummary {
  active: boolean;
  /** Source shown when both coexist: the paid subscription wins over credits. */
  source: PremiumSourceKind | null;
  /** Paid Discord subscription (entitlement). `renewsAt` is null when no end date is known. */
  subscription: { active: boolean; renewsAt: Date | null };
  /** Premium granted against credits. */
  credits: { active: boolean; startedAt: Date | null; expiresAt: Date | null };
}

type PremiumFields = Pick<
  Guild,
  "premium" | "premiumExpiresAt" | "premiumGrantedUntil" | "premiumGrantedAt"
>;

/** Premium status of a guild, source by source: what the dashboard reads. */
export function describePremium(guild: PremiumFields): PremiumSummary {
  const now = Date.now();
  const subscription =
    guild.premium && (!guild.premiumExpiresAt || guild.premiumExpiresAt.getTime() > now);
  const credits = guild.premiumGrantedUntil !== null && guild.premiumGrantedUntil.getTime() > now;

  return {
    active: subscription || credits,
    source: subscription ? "SUBSCRIPTION" : credits ? "CREDITS" : null,
    subscription: { active: subscription, renewsAt: guild.premiumExpiresAt },
    credits: {
      active: credits,
      startedAt: guild.premiumGrantedAt,
      expiresAt: guild.premiumGrantedUntil,
    },
  };
}

export interface PremiumGrantRefund {
  /** Total credited back, across every recipient. */
  refunded: number;
  /** Number of refunded accounts. */
  recipients: number;
  /** Unused share of the window, between 0 and 1. */
  ratio: number;
  /** Granted premium deadline that was just cancelled. */
  grantedUntil: Date;
}

/** Credit movements tied to a guild's granted premium (debits and refunds). */
const GRANT_TRANSACTION_TYPES = ["PREMIUM_REDEEM", "PREMIUM_REFUND"] as const;

/**
 * Turns a guild's unused granted premium back into credits, called when it subscribes to the paid
 * Discord plan: keeping both in parallel would burn the credits for nothing.
 *
 * The refund is pro rata of the remaining time, per contributor and netted against their earlier
 * refunds. The window is closed in the same transaction, which makes the call idempotent.
 *
 * Returns `null` when there is nothing to convert, notably a grant set by hand from the admin panel
 * (`setGuildPremiumGrant`): no start date and no credits spent means no pro rata to compute.
 */
export async function refundUnusedGrantedPremium(
  guildId: string,
): Promise<PremiumGrantRefund | null> {
  return prisma.$transaction(async (tx) => {
    const guild = await tx.guild.findUnique({ where: { id: guildId } });
    const grantedUntil = guild?.premiumGrantedUntil ?? null;
    const grantedAt = guild?.premiumGrantedAt ?? null;

    const now = Date.now();
    if (!grantedUntil || !grantedAt || grantedUntil.getTime() <= now) return null;

    const total = grantedUntil.getTime() - grantedAt.getTime();
    if (total <= 0) return null;

    const ratio = Math.min(1, Math.max(0, (grantedUntil.getTime() - now) / total));

    // Net balance per contributor: a debit already offset by a refund is not counted twice.
    const movements = await tx.creditTransaction.groupBy({
      by: ["userId"],
      where: {
        guildId,
        type: { in: [...GRANT_TRANSACTION_TYPES] },
        createdAt: { gte: grantedAt },
      },
      _sum: { amount: true },
    });

    let refunded = 0;
    let recipients = 0;

    for (const movement of movements) {
      const spent = -(movement._sum?.amount ?? 0);
      // Rounded rather than truncated: subscribing right after a redeem gives everything back,
      // and the ratio being capped at 1, we never refund more than what was spent.
      const amount = Math.round(spent * ratio);
      if (amount <= 0) continue;

      const account = await tx.creditAccount.findUnique({ where: { userId: movement.userId } });
      if (!account) continue;

      // The balance stays capped: an account already at the ceiling does not exceed it.
      const granted = Math.min(amount, MAX_CREDIT_BALANCE - account.balance);
      if (granted <= 0) continue;

      const updated = await tx.creditAccount.update({
        where: { userId: movement.userId },
        data: { balance: { increment: granted } },
      });

      await tx.creditTransaction.create({
        data: {
          userId: movement.userId,
          type: "PREMIUM_REFUND",
          amount: granted,
          balanceAfter: updated.balance,
          guildId,
          reason: `Refund of unused granted premium (${Math.round(ratio * 100)}%)`,
        },
      });

      refunded += granted;
      recipients += 1;
    }

    await tx.guild.update({
      where: { id: guildId },
      data: { premiumGrantedUntil: null, premiumGrantedAt: null },
    });

    return { refunded, recipients, ratio, grantedUntil };
  });
}
