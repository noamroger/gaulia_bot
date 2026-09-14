import type { ShardStatus } from "@prisma/client";

import { prisma } from "../client";

export interface HeartbeatInput {
  shardId: number;
  guildCount: number;
  memberCount: number;
  ping: number;
  memoryMb: number;
  playerCount: number;
  startedAt: Date;
}

/** Upsert appelé périodiquement par chaque process de shard (voir apps/bot/src/core/heartbeat). */
export async function upsertShardHeartbeat(input: HeartbeatInput): Promise<ShardStatus> {
  const { shardId, ...metrics } = input;
  return prisma.shardStatus.upsert({
    where: { shardId },
    update: metrics,
    create: input,
  });
}

export async function listShardStatuses(): Promise<ShardStatus[]> {
  return prisma.shardStatus.findMany({ orderBy: { shardId: "asc" } });
}
