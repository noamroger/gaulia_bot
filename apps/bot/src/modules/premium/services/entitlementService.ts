import type { Entitlement } from "discord.js";

import {
  listActiveEntitlements,
  listPremiumGrantedGuildIds,
  markEntitlementDeleted,
  refundUnusedGrantedPremium,
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

/**
 * Serveurs dont le premium a été offert en échange de crédits (Guild.premiumGrantedUntil). Ces
 * octrois viennent du dashboard, pas de la gateway Discord : le bot n'en est jamais notifié, d'où
 * une relecture périodique en base plutôt qu'un événement.
 */
const grantedPremiumGuildIds = new Set<string>();

const GRANT_REFRESH_INTERVAL_MS = 60_000;

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

/**
 * Souscription d'un abonnement payant. En plus de la mise à jour du statut, le premium offert
 * encore en cours est reconverti en crédits au prorata du temps restant : sans cela il brûlerait
 * en parallèle de l'abonnement, sans rien apporter à celui qui l'a payé de ses votes.
 *
 * Seule la CRÉATION d'un entitlement déclenche cette conversion, jamais une mise à jour ni la
 * resynchronisation du démarrage : un octroi posé à la main depuis le panel admin sur un serveur
 * déjà abonné ne doit pas disparaître au prochain redémarrage du bot.
 */
export async function handleEntitlementCreate(
  client: GauliaClient,
  entitlement: Entitlement,
): Promise<void> {
  await handleEntitlementUpsert(entitlement);

  if (!entitlement.guildId || !premiumGuildIds.has(entitlement.guildId)) return;

  try {
    const refund = await refundUnusedGrantedPremium(entitlement.guildId);
    if (!refund) return;

    grantedPremiumGuildIds.delete(entitlement.guildId);
    client.logger.info(
      {
        guildId: entitlement.guildId,
        refunded: refund.refunded,
        recipients: refund.recipients,
        ratio: Number(refund.ratio.toFixed(3)),
      },
      "Premium offert reconverti en crédits après souscription",
    );
  } catch (error) {
    // L'abonnement reste actif : mieux vaut un remboursement manqué qu'un premium non appliqué.
    client.logger.error(
      { err: error, guildId: entitlement.guildId },
      "Échec du remboursement du premium offert après souscription",
    );
  }
}

export async function handleEntitlementDelete(entitlement: Entitlement): Promise<void> {
  await markEntitlementDeleted(entitlement.id);
  if (entitlement.guildId) {
    await applyPremiumState(entitlement.guildId, false, null);
  }
}

/** Recharge la liste des serveurs au premium offert encore valide (les échéances passées sortent). */
export async function refreshPremiumGrants(): Promise<void> {
  const guildIds = await listPremiumGrantedGuildIds();
  grantedPremiumGuildIds.clear();
  for (const guildId of guildIds) {
    grantedPremiumGuildIds.add(guildId);
  }
}

/** Démarre la synchronisation périodique des premiums offerts (appelée une fois depuis ready). */
export function startPremiumGrantSync(client: GauliaClient): void {
  const refresh = (): void => {
    refreshPremiumGrants().catch((error: unknown) => {
      client.logger.error({ err: error }, "Échec de la synchronisation des premiums offerts");
    });
  };

  refresh();
  setInterval(refresh, GRANT_REFRESH_INTERVAL_MS).unref();
}

/** Un serveur est premium via un entitlement Discord OU via du premium offert (crédits). */
export function isPremiumGuild(guildId: string): boolean {
  return premiumGuildIds.has(guildId) || grantedPremiumGuildIds.has(guildId);
}

/** Vrai uniquement pour le premium offert : permet de l'afficher différemment d'un abonnement. */
export function isGrantedPremiumGuild(guildId: string): boolean {
  return grantedPremiumGuildIds.has(guildId);
}

export function premiumGuildCount(): number {
  return new Set([...premiumGuildIds, ...grantedPremiumGuildIds]).size;
}
