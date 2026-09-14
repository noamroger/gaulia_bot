import {
  getModerationSettings,
  getMusicSettings,
  getOrCreateGuild,
  updateGuild,
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
});

async function loadSettings(guildId: string) {
  const guild = await getOrCreateGuild(guildId);
  const [moderation, music] = await Promise.all([
    getModerationSettings(guildId),
    getMusicSettings(guildId),
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
  };
}

export default async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { guildId: string } }>(
    "/guilds/:guildId/discord",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request, reply) => {
      const resources = await getGuildResources(request.params.guildId);
      if (!resources) {
        return reply.status(404).send({ error: "Gaulia n'a pas accès à ce serveur." });
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
        return reply.status(400).send({ error: "Paramètres invalides." });
      }

      const { guildId } = request.params;
      const body = parsed.data;

      // Empêche de viser un salon ou un rôle d'un autre serveur.
      const resources = await getGuildResources(guildId);
      if (!resources) {
        return reply.status(404).send({ error: "Gaulia n'a pas accès à ce serveur." });
      }
      const channelsKnown = allIdsKnown(
        [
          body.modLogChannelId,
          body.automodLogChannelId,
          body.musicChannelId,
          ...(body.funChannelIds ?? []),
        ],
        resources.channels,
      );
      if (!channelsKnown || !allIdsKnown([body.djRoleId], resources.roles)) {
        return reply.status(400).send({ error: "Salon ou rôle introuvable sur ce serveur." });
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
          // Le 24/7 est premium : on autorise toujours sa désactivation, jamais son activation sans abonnement.
          stay247: body.musicStay247 === true && !guild.premium ? undefined : body.musicStay247,
        }),
      );

      return loadSettings(guildId);
    },
  );
}
