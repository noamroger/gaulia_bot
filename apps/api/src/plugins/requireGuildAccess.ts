import type { FastifyReply, FastifyRequest } from "fastify";

import { hasGuildAccess } from "../auth/session";

/**
 * preHandler à poser après `authenticate` sur toute route `/guilds/:guildId/...` : vérifie que
 * l'utilisateur connecté a bien MANAGE_GUILD (ou est owner) sur ce serveur précis, à partir des
 * infos déjà calculées à la connexion (aucun nouvel appel à l'API Discord).
 */
export async function requireGuildAccess(
  request: FastifyRequest<{ Params: { guildId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  if (!hasGuildAccess(request.user, request.params.guildId)) {
    await reply.status(403).send({ error: "Tu n'as pas accès à ce serveur." });
  }
}
