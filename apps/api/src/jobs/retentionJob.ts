import { purgeExpiredCommandUsage } from "@gaulia/database";

import { logger } from "../logger";

const RETENTION_JOB_INTERVAL_MS = 6 * 60 * 60_000;

async function runRetentionPurge(): Promise<void> {
  try {
    const deleted = await purgeExpiredCommandUsage();
    if (deleted > 0) {
      logger.info({ deleted }, "Statistiques expirées supprimées");
    }
  } catch (error) {
    logger.error({ err: error }, "Échec de la purge des statistiques expirées");
  }
}

/** Applique la durée de conservation des statistiques : au démarrage, puis toutes les 6 h. */
export function startRetentionJob(): void {
  void runRetentionPurge();
  setInterval(() => void runRetentionPurge(), RETENTION_JOB_INTERVAL_MS).unref();
}
