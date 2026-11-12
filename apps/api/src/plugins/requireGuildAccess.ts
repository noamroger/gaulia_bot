import type { FastifyReply, FastifyRequest } from "fastify";

import { hasGuildAccess } from "../auth/session";
import { snowflakeSchema } from "../validation/helpers";

/**
 * preHandler for `/guilds/:guildId/...`, after `authenticate`: checks MANAGE_GUILD (or owner) on
 * that very server, from what was resolved at sign-in, so no extra call to the Discord API.
 */
export async function requireGuildAccess(
  request: FastifyRequest<{ Params: { guildId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  // The id ends up in Discord API paths called with the bot token (guildResources.ts), and owners
  // pass `hasGuildAccess` for any id: it must be a snowflake and nothing else.
  if (!snowflakeSchema.safeParse(request.params.guildId).success) {
    await reply.status(400).send({ error: request.t("errors.guild.invalid") });
    return;
  }
  if (!hasGuildAccess(request.user, request.params.guildId)) {
    await reply.status(403).send({ error: request.t("errors.guild.notManaged") });
  }
}
