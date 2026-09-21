import type { FastifyReply, FastifyRequest } from "fastify";

/** preHandler for every protected route: checks the JWT session cookie. */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    await reply.status(401).send({ error: request.t("errors.auth.required") });
  }
}
