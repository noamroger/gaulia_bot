import { logger } from "../client/logger";
import { env } from "../config/env";
import { deployGuildCommands, syncApplicationCommands } from "./commandRegistry";

/**
 * Manual deployment. Useless in production, where the container syncs the commands on every start
 * (see src/index.ts). `--guild` is for local development against DEV_GUILD_ID.
 */
async function main(): Promise<void> {
  if (!process.argv.includes("--guild")) {
    await syncApplicationCommands();
    return;
  }

  if (!env.DEV_GUILD_ID) {
    throw new Error("DEV_GUILD_ID is required in .env to deploy guild commands.");
  }
  const count = await deployGuildCommands(env.DEV_GUILD_ID);
  logger.info(`${count} command(s) deployed to the dev server ${env.DEV_GUILD_ID}.`);
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "Could not deploy the commands");
  process.exit(1);
});
