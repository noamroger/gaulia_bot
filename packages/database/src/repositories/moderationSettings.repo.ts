import type { ModerationSettings, Prisma } from "@prisma/client";

import { prisma } from "../client";
import { type EscalationStep, parseWarnEscalation } from "../schemas/moderation";
import { getOrCreateGuild } from "./guild.repo";

export interface GuildModerationSettings {
  guildId: string;
  dmOnSanction: boolean;
  warnEscalation: EscalationStep[];
}

export type GuildModerationSettingsUpdate = Partial<Omit<GuildModerationSettings, "guildId">>;

function toSettings(row: ModerationSettings): GuildModerationSettings {
  return {
    guildId: row.guildId,
    dmOnSanction: row.dmOnSanction,
    warnEscalation: parseWarnEscalation(row.warnEscalation),
  };
}

/** Read-only: with no stored settings, returns the defaults without writing anything. */
export async function getModerationSettings(guildId: string): Promise<GuildModerationSettings> {
  const row = await prisma.moderationSettings.findUnique({ where: { guildId } });
  return row ? toSettings(row) : { guildId, dmOnSanction: true, warnEscalation: [] };
}

export async function updateModerationSettings(
  guildId: string,
  update: GuildModerationSettingsUpdate,
): Promise<GuildModerationSettings> {
  await getOrCreateGuild(guildId);

  const data = {
    ...(update.dmOnSanction !== undefined ? { dmOnSanction: update.dmOnSanction } : {}),
    ...(update.warnEscalation !== undefined
      ? { warnEscalation: update.warnEscalation as Prisma.InputJsonValue }
      : {}),
  };

  const row = await prisma.moderationSettings.upsert({
    where: { guildId },
    update: data,
    create: { guildId, ...data },
  });
  return toSettings(row);
}
