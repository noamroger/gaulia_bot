import type { AdventureChannelMode, AdventureSettings } from "@prisma/client";

import { prisma } from "../client";
import { getOrCreateGuild } from "./guild.repo";

/**
 * Par défaut le module est actif mais sa liste blanche est vide : concrètement, l'aventure n'est
 * jouable dans aucun salon du serveur tant qu'un salon n'a pas été autorisé depuis le dashboard.
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
