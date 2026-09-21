import type { FastifyReply, FastifyRequest } from "fastify";

import { hasGuildAccess } from "../auth/session";

/**
 * preHandler for `/guilds/:guildId/...`, after `authenticate`: checks MANAGE_GUILD (or owner) on
 * that very server, from what was resolved at sign-in, so no extra call to the Discord API.
 */
export async function requireGuildAccess(
  request: FastifyRequest<{ Params: { guildId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!hasGuildAccess(request.user, request.params.guildId)) {
    await reply.status(403).send({ error: request.t("errors.guild.notManaged") });
  }
}
