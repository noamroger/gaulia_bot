import type { ShardingManager } from "discord.js";

import { logger } from "../../client/logger";
import { env } from "../../config/env";

/**
 * API top.gg v1 : la clé générée dans l'onglet « Integrations & API » de la page du bot s'envoie
 * en `Authorization: Bearer <clé>`, et les métriques du projet se publient sur
 * `PATCH /projects/@me/metrics` (le projet est déduit de la clé, aucun ID à passer).
 */
const TOPGG_API_BASE = "https://top.gg/api/v1";

/** top.gg recommande une publication régulière plutôt qu'à chaque join/leave. */
const POST_INTERVAL_MS = 30 * 60_000;

/** Laisse aux shards le temps de terminer leur connexion avant le premier envoi. */
const FIRST_POST_DELAY_MS = 60_000;

const REQUEST_TIMEOUT_MS = 10_000;

export function isTopggEnabled(): boolean {
  return env.TOPGG_API_KEY !== "";
}

async function postMetrics(serverCount: number, shardCount: number): Promise<void> {
  const response = await fetch(`${TOPGG_API_BASE}/projects/@me/metrics`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${env.TOPGG_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ server_count: serverCount, shard_count: shardCount }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`top.gg a répondu ${response.status} ${response.statusText} ${body}`.trim());
  }
}

/**
 * Additionne les serveurs vus par chaque shard. `fetchClientValues` interroge tous les process
 * enfants : c'est la seule façon d'obtenir le total réel, `client.guilds.cache` d'un shard ne
 * connaissant que ses propres serveurs — d'où un envoi piloté par le process parent.
 */
async function totalGuildCount(manager: ShardingManager): Promise<number> {
  const counts = (await manager.fetchClientValues("guilds.cache.size")) as (number | undefined)[];
  return counts.reduce((sum: number, count) => sum + (count ?? 0), 0);
}

async function publishStats(manager: ShardingManager): Promise<void> {
  try {
    const serverCount = await totalGuildCount(manager);
    const shardCount = manager.shards.size;
    await postMetrics(serverCount, shardCount);
    logger.info({ serverCount, shardCount }, "Statistiques publiées sur top.gg");
  } catch (error) {
    // Un échec côté top.gg ne doit jamais perturber le bot : on log et on retentera au prochain tour.
    logger.error({ err: error }, "Échec de la publication des statistiques sur top.gg");
  }
}

/**
 * Publie périodiquement le nombre de serveurs sur top.gg depuis le process parent (sharding).
 * Sans `TOPGG_API_KEY`, l'intégration reste simplement inactive.
 */
export function startTopggStatsJob(manager: ShardingManager): void {
  if (!isTopggEnabled()) {
    logger.info("TOPGG_API_KEY absent : publication des statistiques top.gg désactivée");
    return;
  }

  setTimeout(() => void publishStats(manager), FIRST_POST_DELAY_MS).unref();
  setInterval(() => void publishStats(manager), POST_INTERVAL_MS).unref();
}
