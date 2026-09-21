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
 * Marks every server THIS shard can see as present, with an up to date name, icon and member
 * count. `client.guilds.cache` is scoped to the current shard, so servers left while the bot was
 * down cannot be deduced here (it would wipe the other shards' guilds); `events/guildDelete.ts`
 * covers that case live.
 */
export async function syncGuildPresence(client: GauliaClient): Promise<void> {
  await Promise.all(
    client.guilds.cache.map((guild) =>
      upsertGuildInfo(guild.id, { ...guildInfo(guild), botPresent: true }),
    ),
  );
}

/** Member counts move constantly, so they are resynced periodically rather than on every join. */
export function startGuildPresenceResync(client: GauliaClient): void {
  const timer = setInterval(() => {
    syncGuildPresence(client).catch((error: unknown) => {
      client.logger.error({ err: error }, "Could not resync the servers");
    });
  }, RESYNC_INTERVAL_MS);
  timer.unref();
}
