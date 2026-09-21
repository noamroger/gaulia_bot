import {
  ADVENTURE_MAX_CHANNELS,
  BLINDTEST_PRESET_CATEGORIES,
  getAdventureSettings,
  getModerationSettings,
  getMusicSettings,
  getOrCreateGuild,
  updateGuild,
  updateAdventureSettings,
  updateModerationSettings,
  updateMusicSettings,
  warnEscalationSchema,
} from "@gaulia/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { getGuildResources } from "../discord/guildResources";
import { authenticate } from "../plugins/authenticate";
import { requireGuildAccess } from "../plugins/requireGuildAccess";
import { allIdsKnown, definedOnly, snowflakeSchema } from "../validation/helpers";

const updateSettingsSchema = z.object({
  modLogChannelId: snowflakeSchema.nullable().optional(),
  automodLogChannelId: snowflakeSchema.nullable().optional(),
  dmOnSanction: z.boolean().optional(),
  warnEscalation: warnEscalationSchema.optional(),
  musicChannelId: snowflakeSchema.nullable().optional(),
  djRoleId: snowflakeSchema.nullable().optional(),
  musicVolume: z.number().int().min(0).max(150).optional(),
  musicDefaultLoop: z.enum(["NONE", "TRACK", "QUEUE"]).optional(),
  musicStay247: z.boolean().optional(),
  funChannelIds: z.array(snowflakeSchema).max(100).optional(),
  blindtestChannelIds: z.array(snowflakeSchema).max(100).optional(),
  blindtestDisabledCategories: z.array(z.string().max(50)).max(100).optional(),
  adventureEnabled: z.boolean().optional(),
  adventureChannelMode: z.enum(["ALLOWLIST", "BLOCKLIST"]).optional(),
  adventureChannelIds: z.array(snowflakeSchema).max(ADVENTURE_MAX_CHANNELS).optional(),
});

const PRESET_IDS = new Set(BLINDTEST_PRESET_CATEGORIES.map((category) => category.id));

async function loadSettings(guildId: string) {
  const guild = await getOrCreateGuild(guildId);
  const [moderation, music, adventure] = await Promise.all([
    getModerationSettings(guildId),
    getMusicSettings(guildId),
    getAdventureSettings(guildId),
  ]);

  return {
    premium: guild.premium,
    modLogChannelId: guild.modLogChannelId,
    automodLogChannelId: guild.automodLogChannelId,
    dmOnSanction: moderation.dmOnSanction,
    warnEscalation: moderation.warnEscalation,
    musicChannelId: guild.musicChannelId,
    djRoleId: guild.djRoleId,
    musicVolume: music.volume,
    musicDefaultLoop: music.defaultLoop,
    musicStay247: music.stay247,
    funChannelIds: guild.funChannelIds,
    blindtestChannelIds: music.blindtestChannelIds,
    blindtestDisabledCategories: music.blindtestDisabledCategories,
    adventureEnabled: adventure.enabled,
    adventureChannelMode: adventure.channelMode,
    adventureChannelIds: adventure.channelIds,
  };
}

export default async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { guildId: string } }>(
    "/guilds/:guildId/discord",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request, reply) => {
      const resources = await getGuildResources(request.params.guildId);
      if (!resources) {
        return reply.status(404).send({ error: request.t("errors.guild.botMissing") });
      }
      return resources;
    },
  );

  app.get<{ Params: { guildId: string } }>(
    "/guilds/:guildId/settings",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request) => loadSettings(request.params.guildId),
  );

  app.patch<{ Params: { guildId: string } }>(
    "/guilds/:guildId/settings",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request, reply) => {
      const parsed = updateSettingsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: request.t("errors.validation.settings") });
      }

      const { guildId } = request.params;
      const body = parsed.data;

      // Blocks pointing at a channel or a role of another server.
      const resources = await getGuildResources(guildId);
      if (!resources) {
        return reply.status(404).send({ error: request.t("errors.guild.botMissing") });
      }
      const channelsKnown = allIdsKnown(
        [
          body.modLogChannelId,
          body.automodLogChannelId,
          body.musicChannelId,
          ...(body.funChannelIds ?? []),
          ...(body.blindtestChannelIds ?? []),
          ...(body.adventureChannelIds ?? []),
        ],
        resources.channels,
      );
      if (!channelsKnown || !allIdsKnown([body.djRoleId], resources.roles)) {
        return reply.status(400).send({ error: request.t("errors.guild.unknownChannelOrRole") });
      }

      const guild = await getOrCreateGuild(guildId);

      await updateGuild(
        guildId,
        definedOnly({
          modLogChannelId: body.modLogChannelId,
          automodLogChannelId: body.automodLogChannelId,
          musicChannelId: body.musicChannelId,
          djRoleId: body.djRoleId,
          funChannelIds: body.funChannelIds && [...new Set(body.funChannelIds)],
        }),
      );
      await updateModerationSettings(
        guildId,
        definedOnly({ dmOnSanction: body.dmOnSanction, warnEscalation: body.warnEscalation }),
      );
      await updateMusicSettings(
        guildId,
        definedOnly({
          volume: body.musicVolume,
          defaultLoop: body.musicDefaultLoop,
          // 24/7 is premium: turning it off is always allowed, turning it on never is without premium.
          stay247: body.musicStay247 === true && !guild.premium ? undefined : body.musicStay247,
          blindtestChannelIds: body.blindtestChannelIds && [...new Set(body.blindtestChannelIds)],
          blindtestDisabledCategories: body.blindtestDisabledCategories && [
            ...new Set(body.blindtestDisabledCategories.filter((id) => PRESET_IDS.has(id))),
          ],
        }),
      );

      await updateAdventureSettings(
        guildId,
        definedOnly({
          enabled: body.adventureEnabled,
          channelMode: body.adventureChannelMode,
          channelIds: body.adventureChannelIds && [...new Set(body.adventureChannelIds)],
        }),
      );

      return loadSettings(guildId);
    },
  );
}
