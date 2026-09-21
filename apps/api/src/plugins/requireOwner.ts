import type { FastifyReply, FastifyRequest } from "fastify";

/** preHandler for `/admin/...`, after `authenticate`: restricted to OWNER_IDS. */
export async function requireOwner(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.user.isOwner) {
    await reply.status(403).send({ error: request.t("errors.admin.ownersOnly") });
  }
}
