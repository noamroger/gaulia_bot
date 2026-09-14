import { join } from "node:path";

import { ShardingManager } from "discord.js";

import { logger } from "./client/logger";
import { env, totalShards } from "./config/env";
import { syncApplicationCommands } from "./handlers/commandRegistry";

/**
 * Process parent de production : fork un process Node par shard (chacun exécute dist/bot.js,
 * voir src/bot.ts) et les relance automatiquement en cas de crash.
 */
const manager = new ShardingManager(join(__dirname, "bot.js"), {
  token: env.DISCORD_TOKEN,
  totalShards,
  respawn: true,
});

manager.on("shardCreate", (shard) => {
  logger.info(`Shard ${shard.id} lancé`);
  shard.on("death", () => logger.warn(`Shard ${shard.id} arrêté de façon inattendue`));
  shard.on("error", (error) => logger.error({ err: error, shardId: shard.id }, "Erreur de shard"));
});

async function main(): Promise<void> {
  // Une seule fois par démarrage du conteneur, ici plutôt que dans chaque shard.
  try {
    await syncApplicationCommands();
  } catch (error) {
    // Discord indisponible : les commandes déjà enregistrées restent utilisables, on démarre quand même.
    logger.error({ err: error }, "Échec de la synchronisation des commandes slash");
  }

  await manager.spawn();
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "Échec du spawn des shards");
  process.exit(1);
});
