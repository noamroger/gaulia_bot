import type { AdventureChannelMode, AdventureSettings } from "@prisma/client";

import { prisma } from "../client";
import { getOrCreateGuild } from "./guild.repo";

/**
 * The module is enabled by default but its allowlist is empty, so the adventure is playable in no
 * guild channel until one is allowed from the dashboard.
 */
const DEFAULTS: Omit<AdventureSettings, "guildId" | "updatedAt"> = {
  enabled: true,
  channelMode: "ALLOWLIST",
  channelIds: [],
};

export async function getAdventureSettings(guildId: string): Promise<AdventureSettings> {
  await getOrCreateGuild(guildId);
  return prisma.adventureSettings.upsert({
    where: { guildId },
    update: {},
    create: { guildId, ...DEFAULTS },
  });
}

export async function updateAdventureSettings(
  guildId: string,
  data: Partial<{ enabled: boolean; channelMode: AdventureChannelMode; channelIds: string[] }>,
): Promise<AdventureSettings> {
  await getOrCreateGuild(guildId);
  return prisma.adventureSettings.upsert({
    where: { guildId },
    update: data,
    create: { guildId, ...DEFAULTS, ...data },
  });
}
