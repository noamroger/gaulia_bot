import type { FastifyReply, FastifyRequest } from "fastify";

import { hasGuildAccess } from "../auth/session";
import { liveGuildAccess } from "../discord/memberAccess";
import { snowflakeSchema } from "../validation/helpers";

/**
 * preHandler for `/guilds/:guildId/...`, after `authenticate`: checks MANAGE_GUILD (or owner) on
 * that very server. Asked to Discord with the bot token (cached one minute), so someone stripped of
 * their rights loses access now and not when their session ends. When Discord cannot tell (bot not
 * on the server, outage), the list resolved at sign-in decides.
 */
export async function requireGuildAccess(
  request: FastifyRequest<{ Params: { guildId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { guildId } = request.params;
  // The id ends up in Discord API paths called with the bot token, and owners pass
  // `hasGuildAccess` for any id: it must be a snowflake and nothing else.
  if (!snowflakeSchema.safeParse(guildId).success) {
    await reply.status(400).send({ error: request.t("errors.guild.invalid") });
    return;
  }
  if (request.user.isOwner) return;

  const live = await liveGuildAccess(guildId, request.user.userId).catch((error: unknown) => {
    request.log.warn({ err: error, guildId }, "Live guild access check failed");
    return null;
  });
  if (!(live ?? hasGuildAccess(request.user, guildId))) {
    await reply.status(403).send({ error: request.t("errors.guild.notManaged") });
  }
}
