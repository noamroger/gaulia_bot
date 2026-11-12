import type { FastifyReply, FastifyRequest } from "fastify";

import { resolveSession, type TokenPayload } from "../auth/session";

/** preHandler for every protected route: checks the session cookie, then its server side half. */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  let token: TokenPayload;
  try {
    token = await request.jwtVerify<TokenPayload>();
  } catch {
    await reply.status(401).send({ error: request.t("errors.auth.required") });
    return;
  }

  const session = await resolveSession(token);
  if (!session) {
    await reply.status(401).send({ error: request.t("errors.auth.required") });
    return;
  }
  request.user = session;
}
