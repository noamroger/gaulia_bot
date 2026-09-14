import type { Entitlement } from "discord.js";

import {
  listActiveEntitlements,
  markEntitlementDeleted,
  setGuildPremium,
  upsertEntitlement,
} from "@gaulia/database";

import type { GauliaClient } from "../../../client/GauliaClient";
import { env } from "../../../config/env";

/**
 * Cache en mémoire (par process de shard) des serveurs disposant de l'abonnement Gaulia Premium.
 * Source de vérité : les entitlements Discord (Monetization API), synchronisés au boot puis en
 * temps réel via les événements gateway entitlementCreate/Update/Delete. La table Postgres
 * `premium_entitlements` sert de cache de secours si l'appel REST échoue au démarrage, et
 * `Guild.premium`/`premiumExpiresAt` sont mis à jour en miroir pour que l'API du dashboard (qui
 * n'a pas accès à ce cache mémoire) puisse lire le statut sans dépendre du process du bot.
 */
const premiumGuildIds = new Set<string>();

function isActivePremiumEntitlement(skuId: string, endsAt: Date | null): boolean {
  if (env.PREMIUM_SKU_ID === "" || skuId !== env.PREMIUM_SKU_ID) return false;
  return !endsAt || endsAt.getTime() > Date.now();
}

async function applyPremiumState(
  guildId: string,
  active: boolean,
  endsAt: Date | null,
): Promise<void> {
  if (active) {
    premiumGuildIds.add(guildId);
  } else {
    premiumGuildIds.delete(guildId);
  }
  await setGuildPremium(guildId, active, endsAt);
}

async function hydrateFromDatabaseCache(): Promise<void> {
  const cached = await listActiveEntitlements();
  for (const entitlement of cached) {
    if (entitlement.guildId && isActivePremiumEntitlement(entitlement.skuId, entitlement.endsAt)) {
      premiumGuildIds.add(entitlement.guildId);
    }
  }
}

async function persistEntitlement(entitlement: Entitlement): Promise<void> {
  await upsertEntitlement({
    id: entitlement.id,
    skuId: entitlement.skuId,
    guildId: entitlement.guildId,
    userId: entitlement.userId,
    startsAt: entitlement.startsTimestamp ? new Date(entitlement.startsTimestamp) : null,
    endsAt: entitlement.endsTimestamp ? new Date(entitlement.endsTimestamp) : null,
  });
}

/**
 * Synchronisation complète au démarrage : hydrate d'abord depuis le cache Postgres (résilience si
 * l'API Discord est momentanément indisponible), puis récupère la liste réelle des entitlements.
 */
export async function initEntitlements(client: GauliaClient): Promise<void> {
  await hydrateFromDatabaseCache();

  if (!client.application) {
    client.logger.warn("client.application indisponible, sync entitlements reportée");
    return;
  }

  const entitlements = await client.application.entitlements.fetch();

  premiumGuildIds.clear();

  for (const entitlement of entitlements.values()) {
    await persistEntitlement(entitlement);

    if (!entitlement.guildId) continue;

    const active = isActivePremiumEntitlement(
      entitlement.skuId,
      entitlement.endsTimestamp ? new Date(entitlement.endsTimestamp) : null,
    );
    await applyPremiumState(
      entitlement.guildId,
      active,
      entitlement.endsTimestamp ? new Date(entitlement.endsTimestamp) : null,
    );
  }

  client.logger.info(`${premiumGuildIds.size} serveur(s) premium synchronisé(s) depuis Discord`);
}

export async function handleEntitlementUpsert(entitlement: Entitlement): Promise<void> {
  await persistEntitlement(entitlement);
  if (!entitlement.guildId) return;

  const endsAt = entitlement.endsTimestamp ? new Date(entitlement.endsTimestamp) : null;
  const active = isActivePremiumEntitlement(entitlement.skuId, endsAt);
  await applyPremiumState(entitlement.guildId, active, endsAt);
}

export async function handleEntitlementDelete(entitlement: Entitlement): Promise<void> {
  await markEntitlementDeleted(entitlement.id);
  if (entitlement.guildId) {
    await applyPremiumState(entitlement.guildId, false, null);
  }
}

export function isPremiumGuild(guildId: string): boolean {
  return premiumGuildIds.has(guildId);
}

export function premiumGuildCount(): number {
  return premiumGuildIds.size;
}
