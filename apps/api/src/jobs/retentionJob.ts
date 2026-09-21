import {
  deleteAdventureQuestsBefore,
  deleteAdventureTradesBefore,
  purgeExpiredCommandUsage,
  purgeExpiredShardMetrics,
} from "@gaulia/database";

import { logger } from "../logger";

const RETENTION_JOB_INTERVAL_MS = 6 * 60 * 60_000;
/** Past quests and closed trades only serve the recent history: 30 days is enough. */
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
        "Expired data deleted",
      );
    }
  } catch (error) {
    logger.error({ err: error }, "Expired data purge failed");
  }
}

/** Enforces the retention windows (statistics, quests): at startup, then every 6 hours. */
export function startRetentionJob(): void {
  void runRetentionPurge();
  setInterval(() => void runRetentionPurge(), RETENTION_JOB_INTERVAL_MS).unref();
}
