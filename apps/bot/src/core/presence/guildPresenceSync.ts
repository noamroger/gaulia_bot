import { upsertGuildInfo } from "@gaulia/database";
import type { Guild } from "discord.js";

import type { GauliaClient } from "../../client/GauliaClient";

const RESYNC_INTERVAL_MS = 15 * 60_000;

export function guildInfo(guild: Guild): {
  name: string;
  icon: string | null;
  memberCount: number;
} {
  return { name: guild.name, icon: guild.icon, memberCount: guild.memberCount };
}

/**
 * Marque comme présents en base (nom, icône et nombre de membres à jour) tous les serveurs vus par
 * CE shard. Note : `client.guilds.cache` n'est scopé qu'au shard courant, donc on ne peut pas
 * déduire ici les serveurs quittés pendant l'arrêt (ça casserait les guildes des AUTRES shards) —
 * `events/guildDelete.ts` gère ce cas en direct pendant que le bot tourne.
 */
export async function syncGuildPresence(client: GauliaClient): Promise<void> {
  await Promise.all(
    client.guilds.cache.map((guild) =>
      upsertGuildInfo(guild.id, { ...guildInfo(guild), botPresent: true }),
    ),
  );
}

/** Le nombre de membres change en continu : resynchronisation périodique plutôt qu'à chaque arrivée/départ. */
export function startGuildPresenceResync(client: GauliaClient): void {
  const timer = setInterval(() => {
    syncGuildPresence(client).catch((error: unknown) => {
      client.logger.error({ err: error }, "Échec de la resynchronisation des serveurs");
    });
  }, RESYNC_INTERVAL_MS);
  timer.unref();
}
