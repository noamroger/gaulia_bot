import { automodRulesSchema, getAutomodConfig, updateAutomodConfig } from "@gaulia/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { getGuildResources } from "../discord/guildResources";
import { authenticate } from "../plugins/authenticate";
import { requireGuildAccess } from "../plugins/requireGuildAccess";
import { allIdsKnown, definedOnly, snowflakeSchema } from "../validation/helpers";

const updateAutomodSchema = z.object({
  rules: automodRulesSchema.optional(),
  ignoredChannelIds: z.array(snowflakeSchema).max(100).optional(),
  ignoredRoleIds: z.array(snowflakeSchema).max(100).optional(),
  exemptStaff: z.boolean().optional(),
});

export default async function automodRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { guildId: string } }>(
    "/guilds/:guildId/automod",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request) => getAutomodConfig(request.params.guildId),
  );

  app.patch<{ Params: { guildId: string } }>(
    "/guilds/:guildId/automod",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request, reply) => {
      const parsed = updateAutomodSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Paramètres invalides." });
      }

      const { guildId } = request.params;
      const body = parsed.data;

      const resources = await getGuildResources(guildId);
      if (!resources) {
        return reply.status(404).send({ error: "Gaulia n'a pas accès à ce serveur." });
      }
      const idsKnown =
        allIdsKnown(body.ignoredChannelIds ?? [], resources.channels) &&
        allIdsKnown(body.ignoredRoleIds ?? [], resources.roles);
      if (!idsKnown) {
        return reply.status(400).send({ error: "Salon ou rôle introuvable sur ce serveur." });
      }

      return updateAutomodConfig(guildId, definedOnly(body));
    },
  );
}
