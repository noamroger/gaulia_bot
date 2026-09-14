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
 * Point d'entrée d'un process de shard unique. Lancé directement en dev (`npm run dev`, un seul
 * process = shard 0/1), ou spawné une fois par shard par le ShardingManager (`src/index.ts`) en
 * production.
 */
async function main(): Promise<void> {
  const client = new GauliaClient();

  // Attaché avant le login pour que le forwarding des events voix ci-dessous fonctionne dès la
  // connexion.
  client.lavalink = createMusicManager(client);

  // lavalink-client a besoin des paquets gateway bruts (VOICE_STATE_UPDATE / VOICE_SERVER_UPDATE)
  // pour établir les connexions vocales. discord.js n'expose plus "raw" dans son typage public
  // (ClientEvents) mais continue de l'émettre au runtime — c'est l'intégration recommandée par
  // lavalink-client lui-même, d'où le cast local ici.
  client.on("raw", (packet: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- paquet gateway brut, non typé côté discord.js
    void client.lavalink.sendRawData(packet as any);
  });

  await loadCommands(client);
  await loadComponents(client);
  await loadEvents(client);

  await client.login(env.DISCORD_TOKEN);

  const shutdown = (signal: string): void => {
    client.logger.info(`Signal ${signal} reçu, arrêt en cours…`);
    stopHeartbeat();
    void client.destroy();
    void disconnectDatabase().finally(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error("Échec du démarrage du bot :", error);
  process.exit(1);
});
