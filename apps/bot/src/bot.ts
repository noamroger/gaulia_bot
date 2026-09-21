import "./config/env";

import { GauliaClient } from "./client/GauliaClient";
import { env } from "./config/env";
import { disconnectDatabase } from "@gaulia/database";
import { loadCommands } from "./handlers/commandHandler";
import { loadComponents } from "./handlers/componentHandler";
import { loadEvents } from "./handlers/eventHandler";
import { stopHeartbeat } from "./core/heartbeat/heartbeatService";
import { createMusicManager } from "./modules/music/services/musicManager";

/**
 * Entry point of a single shard process. Run directly in dev (`npm run dev`, one process means
 * shard 0/1), or spawned once per shard by the ShardingManager (`src/index.ts`) in
 * production.
 */
async function main(): Promise<void> {
  const client = new GauliaClient();

  // Attached before login so the voice event forwarding below works from the very first
  // connexion.
  client.lavalink = createMusicManager(client);

  // lavalink-client a besoin des paquets gateway bruts (VOICE_STATE_UPDATE / VOICE_SERVER_UPDATE)
  // to establish the voice connections. discord.js no longer exposes "raw" in its public typing
  // (ClientEvents) but still emits it at runtime; this is the integration lavalink-client itself
  // recommends, hence the local cast.
  client.on("raw", (packet: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw gateway packet, untyped in discord.js
    void client.lavalink.sendRawData(packet as any);
  });

  await loadCommands(client);
  await loadComponents(client);
  await loadEvents(client);

  await client.login(env.DISCORD_TOKEN);

  const shutdown = (signal: string): void => {
    client.logger.info(`Signal ${signal} received, shutting down...`);
    stopHeartbeat();
    void client.destroy();
    void disconnectDatabase().finally(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error("Could not start the bot:", error);
  process.exit(1);
});
