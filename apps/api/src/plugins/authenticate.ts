import type { FastifyReply, FastifyRequest } from "fastify";

/** preHandler à poser sur toute route protégée : vérifie le cookie de session JWT. */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    await reply.status(401).send({ error: "Non authentifié." });
  }
}
