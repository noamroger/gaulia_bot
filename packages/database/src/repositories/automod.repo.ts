import type { AutomodConfig, Prisma } from "@prisma/client";

import { prisma } from "../client";
import { type AutomodRules, automodRulesSchema, parseAutomodRules } from "../schemas/automod";
import { getOrCreateGuild } from "./guild.repo";

export interface AutomodSettings {
  guildId: string;
  rules: AutomodRules;
  ignoredChannelIds: string[];
  ignoredRoleIds: string[];
  exemptStaff: boolean;
}

export type AutomodSettingsUpdate = Partial<Omit<AutomodSettings, "guildId">>;

function toSettings(row: AutomodConfig): AutomodSettings {
  return {
    guildId: row.guildId,
    rules: parseAutomodRules(row.rules),
    ignoredChannelIds: row.ignoredChannelIds,
    ignoredRoleIds: row.ignoredRoleIds,
    exemptStaff: row.exemptStaff,
  };
}

/** Read-only: with no stored config, returns the defaults without writing anything. */
export async function getAutomodConfig(guildId: string): Promise<AutomodSettings> {
  const row = await prisma.automodConfig.findUnique({ where: { guildId } });
  if (row) return toSettings(row);

  return {
    guildId,
    rules: automodRulesSchema.parse({}),
    ignoredChannelIds: [],
    ignoredRoleIds: [],
    exemptStaff: true,
  };
}

export async function updateAutomodConfig(
  guildId: string,
  update: AutomodSettingsUpdate,
): Promise<AutomodSettings> {
  await getOrCreateGuild(guildId);

  const data = {
    ...(update.rules !== undefined ? { rules: update.rules as Prisma.InputJsonValue } : {}),
    ...(update.ignoredChannelIds !== undefined
      ? { ignoredChannelIds: update.ignoredChannelIds }
      : {}),
    ...(update.ignoredRoleIds !== undefined ? { ignoredRoleIds: update.ignoredRoleIds } : {}),
    ...(update.exemptStaff !== undefined ? { exemptStaff: update.exemptStaff } : {}),
  };

  const row = await prisma.automodConfig.upsert({
    where: { guildId },
    update: data,
    create: { guildId, ...data },
  });
  return toSettings(row);
}
