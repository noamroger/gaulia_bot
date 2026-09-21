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
 * In memory cache, per shard process, of the servers holding a Gaulia Premium subscription. The
 * source of truth is the Discord entitlements (Monetization API), synced at boot then live through
 * the entitlementCreate/Update/Delete gateway events. The `premium_entitlements` table is the
 * fallback when the REST call fails at startup, and `Guild.premium`/`premiumExpiresAt` mirror the
 * status so the dashboard API, which has no access to this cache, can read it without the bot.
 */
const premiumGuildIds = new Set<string>();

/**
 * Servers whose premium was granted against credits (Guild.premiumGrantedUntil). Those grants come
 * from the dashboard, not from the Discord gateway, so the bot is never notified: hence a periodic
 * reread rather than an event.
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
 * Full sync at startup: hydrate from the Postgres cache first, in case the Discord API is briefly
 * unavailable, then fetch the real entitlement list.
 */
export async function initEntitlements(client: GauliaClient): Promise<void> {
  await hydrateFromDatabaseCache();

  if (!client.application) {
    client.logger.warn("client.application unavailable, entitlement sync postponed");
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

  client.logger.info(`${premiumGuildIds.size} premium server(s) synced from Discord`);
}

export async function handleEntitlementUpsert(entitlement: Entitlement): Promise<void> {
  await persistEntitlement(entitlement);
  if (!entitlement.guildId) return;

  const endsAt = entitlement.endsTimestamp ? new Date(entitlement.endsTimestamp) : null;
  const active = isActivePremiumEntitlement(entitlement.skuId, endsAt);
  await applyPremiumState(entitlement.guildId, active, endsAt);
}

/**
 * A paid subscription starts. Beyond the status update, any granted premium still running is
 * converted back into credits, prorated on the time left: otherwise it would burn alongside the
 * subscription, giving nothing back to whoever paid for it with their votes.
 *
 * Only the CREATION of an entitlement triggers that conversion, never an update nor the startup
 * resync: a grant set by hand from the admin panel on an already subscribed server must not
 * vanish on the next restart.
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
      "Granted premium converted back into credits after a subscription",
    );
  } catch (error) {
    // The subscription stays active: a missed refund beats a premium that never applies.
    client.logger.error(
      { err: error, guildId: entitlement.guildId },
      "Could not refund the granted premium after a subscription",
    );
  }
}

export async function handleEntitlementDelete(entitlement: Entitlement): Promise<void> {
  await markEntitlementDeleted(entitlement.id);
  if (entitlement.guildId) {
    await applyPremiumState(entitlement.guildId, false, null);
  }
}

/** Reloads the servers whose granted premium is still valid; expired ones drop out. */
export async function refreshPremiumGrants(): Promise<void> {
  const guildIds = await listPremiumGrantedGuildIds();
  grantedPremiumGuildIds.clear();
  for (const guildId of guildIds) {
    grantedPremiumGuildIds.add(guildId);
  }
}

/** Starts the periodic sync of granted premiums, called once from ready. */
export function startPremiumGrantSync(client: GauliaClient): void {
  const refresh = (): void => {
    refreshPremiumGrants().catch((error: unknown) => {
      client.logger.error({ err: error }, "Could not sync the granted premiums");
    });
  };

  refresh();
  setInterval(refresh, GRANT_REFRESH_INTERVAL_MS).unref();
}

/** A server is premium through a Discord entitlement OR through granted premium (credits). */
export function isPremiumGuild(guildId: string): boolean {
  return premiumGuildIds.has(guildId) || grantedPremiumGuildIds.has(guildId);
}

/** True for granted premium only, so it can be displayed differently from a subscription. */
export function isGrantedPremiumGuild(guildId: string): boolean {
  return grantedPremiumGuildIds.has(guildId);
}

export function premiumGuildCount(): number {
  return new Set([...premiumGuildIds, ...grantedPremiumGuildIds]).size;
}
