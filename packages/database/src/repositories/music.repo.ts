import type { LoopMode, MusicSettings } from "@prisma/client";

import { prisma } from "../client";
import { getOrCreateGuild } from "./guild.repo";

const DEFAULTS: Omit<MusicSettings, "guildId" | "updatedAt"> = {
  volume: 100,
  stay247: false,
  defaultLoop: "NONE",
  blindtestChannelIds: [],
  blindtestDisabledCategories: [],
};

export async function getMusicSettings(guildId: string): Promise<MusicSettings> {
  const existing = await prisma.musicSettings.findUnique({ where: { guildId } });
  if (existing) return existing;

  // Same race-free creation as getOrCreateGuild.
  await getOrCreateGuild(guildId);
  await prisma.musicSettings.createMany({ data: [{ guildId, ...DEFAULTS }], skipDuplicates: true });
  return prisma.musicSettings.findUniqueOrThrow({ where: { guildId } });
}

export async function updateMusicSettings(
  guildId: string,
  data: Partial<{
    volume: number;
    stay247: boolean;
    defaultLoop: LoopMode;
    blindtestChannelIds: string[];
    blindtestDisabledCategories: string[];
  }>,
): Promise<MusicSettings> {
  await getOrCreateGuild(guildId);
  return prisma.musicSettings.upsert({
    where: { guildId },
    update: data,
    create: { guildId, ...DEFAULTS, ...data },
  });
}
