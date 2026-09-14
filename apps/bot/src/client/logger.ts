import pino from "pino";

import { env } from "../config/env";

// Défini automatiquement par le ShardingManager discord.js sur chaque process enfant.
const shards = process.env["SHARDS"];

export const logger = pino({
  level: env.LOG_LEVEL,
  base: shards ? { shards } : undefined,
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        }
      : undefined,
});
