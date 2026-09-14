import type { FastifyReply, FastifyRequest } from "fastify";

/** preHandler à poser après `authenticate` sur toute route `/admin/...` — réservé aux OWNER_IDS. */
export async function requireOwner(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.user.isOwner) {
    await reply.status(403).send({ error: "Accès réservé aux propriétaires du bot." });
  }
}
