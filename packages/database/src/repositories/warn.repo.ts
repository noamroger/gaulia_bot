import type { Warn } from "@prisma/client";

import { prisma } from "../client";
import { getOrCreateGuild } from "./guild.repo";

export async function createWarn(
  guildId: string,
  userId: string,
  moderatorId: string,
  reason?: string,
): Promise<Warn> {
  await getOrCreateGuild(guildId);
  return prisma.warn.create({
    data: { guildId, userId, moderatorId, reason },
  });
}

export async function listActiveWarns(guildId: string, userId: string): Promise<Warn[]> {
  return prisma.warn.findMany({
    where: { guildId, userId, active: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function countActiveWarns(guildId: string, userId: string): Promise<number> {
  return prisma.warn.count({ where: { guildId, userId, active: true } });
}

export async function revokeWarn(warnId: number): Promise<Warn> {
  return prisma.warn.update({ where: { id: warnId }, data: { active: false } });
}
