import { logger } from "../client/logger";
import { env } from "../config/env";
import { deployGuildCommands, syncApplicationCommands } from "./commandRegistry";

/**
 * Déploiement manuel. En production c'est inutile : le conteneur synchronise les commandes à chaque
 * démarrage (voir src/index.ts). `--guild` sert au développement local sur DEV_GUILD_ID.
 */
async function main(): Promise<void> {
  if (!process.argv.includes("--guild")) {
    await syncApplicationCommands();
    return;
  }

  if (!env.DEV_GUILD_ID) {
    throw new Error("DEV_GUILD_ID est requis dans .env pour un déploiement de commandes guild.");
  }
  const count = await deployGuildCommands(env.DEV_GUILD_ID);
  logger.info(`${count} commande(s) déployée(s) sur le serveur de dev ${env.DEV_GUILD_ID}.`);
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "Échec du déploiement des commandes");
  process.exit(1);
});
