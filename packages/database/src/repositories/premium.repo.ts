import type { Guild, PremiumEntitlement } from "@prisma/client";

import { prisma } from "../client";

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
  const base =
    guild.premiumGrantedUntil && guild.premiumGrantedUntil.getTime() > now
      ? guild.premiumGrantedUntil.getTime()
      : now;
  const premiumGrantedUntil = new Date(base + durationMs);

  await prisma.guild.update({ where: { id: guildId }, data: { premiumGrantedUntil } });
  return premiumGrantedUntil;
}

/** Fixe (ou retire, avec `null`) l'échéance du premium offert — panel admin. */
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

/**
 * Un serveur est premium s'il a un entitlement Discord actif OU du premium offert encore valide.
 * Utilisé partout où le statut est lu (API, bot) pour ne pas oublier l'une des deux sources.
 */
export function isPremiumActive(guild: {
  premium: boolean;
  premiumExpiresAt: Date | null;
  premiumGrantedUntil: Date | null;
}): boolean {
  const now = Date.now();
  if (guild.premium && (!guild.premiumExpiresAt || guild.premiumExpiresAt.getTime() > now)) {
    return true;
  }
  return guild.premiumGrantedUntil !== null && guild.premiumGrantedUntil.getTime() > now;
}
