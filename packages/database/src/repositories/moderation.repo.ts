import type { ModerationCase, ModerationCaseType } from "@prisma/client";

import { prisma } from "../client";
import { getOrCreateGuild } from "./guild.repo";

export interface CreateCaseInput {
  guildId: string;
  type: ModerationCaseType;
  targetId: string;
  targetTag: string;
  moderatorId: string;
  moderatorTag: string;
  reason?: string | undefined;
  durationSecs?: number | undefined;
}

/**
 * Crée un nouveau cas de modération avec un numéro auto-incrémenté par serveur.
 * Utilise une transaction pour éviter les collisions de numéro sous forte concurrence.
 */
export async function createModerationCase(input: CreateCaseInput): Promise<ModerationCase> {
  await getOrCreateGuild(input.guildId);

  return prisma.$transaction(async (tx) => {
    const last = await tx.moderationCase.findFirst({
      where: { guildId: input.guildId },
      orderBy: { caseNumber: "desc" },
      select: { caseNumber: true },
    });

    const caseNumber = (last?.caseNumber ?? 0) + 1;

    return tx.moderationCase.create({
      data: {
        guildId: input.guildId,
        caseNumber,
        type: input.type,
        targetId: input.targetId,
        targetTag: input.targetTag,
        moderatorId: input.moderatorId,
        moderatorTag: input.moderatorTag,
        reason: input.reason,
        durationSecs: input.durationSecs,
      },
    });
  });
}

export async function getModerationCase(
  guildId: string,
  caseNumber: number,
): Promise<ModerationCase | null> {
  return prisma.moderationCase.findUnique({
    where: { guildId_caseNumber: { guildId, caseNumber } },
  });
}

export async function listModerationCases(
  guildId: string,
  targetId?: string,
  limit = 10,
): Promise<ModerationCase[]> {
  return prisma.moderationCase.findMany({
    where: { guildId, ...(targetId ? { targetId } : {}) },
    orderBy: { caseNumber: "desc" },
    take: limit,
  });
}
