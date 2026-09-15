import {
  deleteAdventureQuestsBefore,
  deleteAdventureTradesBefore,
  purgeExpiredCommandUsage,
  purgeExpiredShardMetrics,
} from "@gaulia/database";

import { logger } from "../logger";

const RETENTION_JOB_INTERVAL_MS = 6 * 60 * 60_000;
/** Quêtes passées et échanges clos ne servent qu'à l'historique récent : 30 jours suffisent. */
const ADVENTURE_RETENTION_DAYS = 30;

async function runRetentionPurge(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - ADVENTURE_RETENTION_DAYS * 24 * 3_600_000);
    const [commandUsage, shardMetrics, adventureQuests, adventureTrades] = await Promise.all([
      purgeExpiredCommandUsage(),
      purgeExpiredShardMetrics(),
      deleteAdventureQuestsBefore(cutoff),
      deleteAdventureTradesBefore(cutoff),
    ]);
    if (commandUsage > 0 || shardMetrics > 0 || adventureQuests > 0 || adventureTrades > 0) {
      logger.info(
        { commandUsage, shardMetrics, adventureQuests, adventureTrades },
        "Données expirées supprimées",
      );
    }
  } catch (error) {
    logger.error({ err: error }, "Échec de la purge des données expirées");
  }
}

/** Applique les durées de conservation (statistiques, quêtes) : au démarrage, puis toutes les 6 h. */
export function startRetentionJob(): void {
  void runRetentionPurge();
  setInterval(() => void runRetentionPurge(), RETENTION_JOB_INTERVAL_MS).unref();
}
