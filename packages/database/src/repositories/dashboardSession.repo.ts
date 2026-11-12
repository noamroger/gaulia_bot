import type { Prisma } from "@prisma/client";

import { prisma } from "../client";

export interface SessionGuild {
  id: string;
  name: string;
  icon: string | null;
}

export async function createDashboardSession(input: {
  id: string;
  userId: string;
  manageableGuilds: SessionGuild[];
  expiresAt: Date;
}): Promise<void> {
  await prisma.dashboardSession.create({
    data: {
      ...input,
      manageableGuilds: input.manageableGuilds as unknown as Prisma.InputJsonValue,
    },
  });
}

/** The servers of a live session, or null when it was closed, erased or has expired. */
export async function getDashboardSessionGuilds(
  id: string,
  userId: string,
): Promise<SessionGuild[] | null> {
  const row = await prisma.dashboardSession.findUnique({ where: { id } });
  if (!row || row.userId !== userId || row.expiresAt.getTime() <= Date.now()) return null;
  return Array.isArray(row.manageableGuilds)
    ? (row.manageableGuilds as unknown as SessionGuild[])
    : [];
}

export async function deleteDashboardSession(id: string): Promise<void> {
  await prisma.dashboardSession.deleteMany({ where: { id } });
}

/** Removes expired sessions; called by the API retention job. */
export async function purgeExpiredDashboardSessions(): Promise<number> {
  const { count } = await prisma.dashboardSession.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return count;
}
