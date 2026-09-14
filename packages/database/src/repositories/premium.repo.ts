import type { PremiumEntitlement } from "@prisma/client";

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
