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
 * Prolonge le premium offert d'un serveur (crédits échangés). La nouvelle échéance repart de
 * l'échéance en cours si elle est encore valide, pour que deux échanges se cumulent au lieu de
 * s'écraser. Indépendant de `Guild.premium`, qui reflète les entitlements Discord.
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
      // Une fenêtre déjà en cours conserve sa date de début : les échanges successifs forment une
      // seule période, remboursable d'un bloc au prorata (voir refundUnusedGrantedPremium).
      ...(running && guild.premiumGrantedAt !== null ? {} : { premiumGrantedAt: new Date(now) }),
    },
  });
  return premiumGrantedUntil;
}

/** Fixe (ou retire, avec `null`) l'échéance du premium offert - panel admin. */
export async function setGuildPremiumGrant(guildId: string, until: Date | null): Promise<Guild> {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: { premiumGrantedUntil: until },
    create: { id: guildId, premiumGrantedUntil: until },
  });
}

/** Serveurs dont le premium offert court encore, relus périodiquement par le bot. */
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
  /** Source affichée quand les deux coexistent : l'abonnement payant prime sur les crédits. */
  source: PremiumSourceKind | null;
  /** Abonnement Discord payant (entitlement). `renewsAt` est nul pour un abonnement sans échéance connue. */
  subscription: { active: boolean; renewsAt: Date | null };
  /** Premium offert contre des crédits. */
  credits: { active: boolean; startedAt: Date | null; expiresAt: Date | null };
}

type PremiumFields = Pick<
  Guild,
  "premium" | "premiumExpiresAt" | "premiumGrantedUntil" | "premiumGrantedAt"
>;

/** Détaille le statut premium d'un serveur, source par source : ce que lit le dashboard. */
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
  /** Total recrédité, tous bénéficiaires confondus. */
  refunded: number;
  /** Nombre de comptes remboursés. */
  recipients: number;
  /** Part non consommée de la fenêtre, entre 0 et 1. */
  ratio: number;
  /** Échéance du premium offert qui vient d'être annulée. */
  grantedUntil: Date;
}

/** Mouvements de crédits liés au premium offert d'un serveur (débits et remboursements). */
const GRANT_TRANSACTION_TYPES = ["PREMIUM_REDEEM", "PREMIUM_REFUND"] as const;

/**
 * Convertit en crédits le premium offert non consommé d'un serveur, appelé quand il souscrit
 * l'abonnement Discord payant : garder les deux en parallèle brûlerait les crédits pour rien.
 *
 * Le remboursement est au prorata du temps restant : il reste la moitié de la fenêtre, la moitié
 * des crédits dépensés revient. Chaque contributeur est remboursé sur ce qu'il a réellement payé
 * (les débits sont nettés de leurs éventuels remboursements), et la fenêtre est refermée dans la
 * même transaction - ce qui rend l'opération naturellement idempotente : un second appel ne
 * trouve plus rien à rembourser.
 *
 * Retourne `null` s'il n'y a rien à convertir, notamment pour un octroi posé à la main depuis le
 * panel admin (`setGuildPremiumGrant`) : sans date de début ni crédits dépensés, il n'y a aucun
 * prorata à calculer, et la fenêtre est laissée intacte.
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

    // Solde net par contributeur : un débit annulé par un remboursement ne compte pas deux fois.
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
      // Arrondi plutôt que troncature : souscrire à l'instant même d'un échange rend bien la
      // totalité, et le ratio étant borné à 1, on ne rembourse jamais plus que la mise.
      const amount = Math.round(spent * ratio);
      if (amount <= 0) continue;

      const account = await tx.creditAccount.findUnique({ where: { userId: movement.userId } });
      if (!account) continue;

      // Le solde reste borné : un compte déjà au plafond ne le dépasse pas.
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
          reason: `Remboursement du premium offert non consommé (${Math.round(ratio * 100)} %)`,
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
