import type { LoopMode, MusicSettings } from "@prisma/client";

import { prisma } from "../client";
import { getOrCreateGuild } from "./guild.repo";

const DEFAULTS: Omit<MusicSettings, "guildId" | "updatedAt"> = {
  volume: 100,
  stay247: false,
  defaultLoop: "NONE",
};

export async function getMusicSettings(guildId: string): Promise<MusicSettings> {
  await getOrCreateGuild(guildId);
  return prisma.musicSettings.upsert({
    where: { guildId },
    update: {},
    create: { guildId, ...DEFAULTS },
  });
}

export async function updateMusicSettings(
  guildId: string,
  data: Partial<{ volume: number; stay247: boolean; defaultLoop: LoopMode }>,
): Promise<MusicSettings> {
  await getOrCreateGuild(guildId);
  return prisma.musicSettings.upsert({
    where: { guildId },
    update: data,
    create: { guildId, ...DEFAULTS, ...data },
  });
}
