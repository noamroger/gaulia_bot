import { join } from "node:path";

import { ShardingManager } from "discord.js";

import { logger } from "./client/logger";
import { env, totalShards } from "./config/env";
import { startTopggStatsJob } from "./core/topgg/topggService";
import { syncApplicationCommands } from "./handlers/commandRegistry";

/**
 * Production parent process: forks one Node process per shard (each running dist/bot.js,
 * voir src/bot.ts) et les relance automatiquement en cas de crash.
 */
const manager = new ShardingManager(join(__dirname, "bot.js"), {
  token: env.DISCORD_TOKEN,
  totalShards,
  respawn: true,
});

manager.on("shardCreate", (shard) => {
  logger.info(`Shard ${shard.id} started`);
  shard.on("death", () => logger.warn(`Shard ${shard.id} stopped unexpectedly`));
  shard.on("error", (error) => logger.error({ err: error, shardId: shard.id }, "Erreur de shard"));
});

async function main(): Promise<void> {
  // Once per container start, here rather than inside every shard.
  try {
    await syncApplicationCommands();
  } catch (error) {
    // Discord unavailable: the already registered commands still work, so start anyway.
    logger.error({ err: error }, "Could not sync the slash commands");
  }

  await manager.spawn();

  // Only after the spawn: the server total is computed by asking the shards.
  startTopggStatsJob(manager);
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "Could not spawn the shards");
  process.exit(1);
});
