import {
  eraseGuildData,
  eraseOwnUserData,
  exportUserData,
  getGuildDataSummary,
  listStoredGuilds,
} from "@gaulia/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { authenticate } from "../plugins/authenticate";
import { requireGuildAccess } from "../plugins/requireGuildAccess";
import { SESSION_COOKIE } from "./auth.routes";

/**
 * Words to type back to confirm an erasure. The word is translated for the reader, so the API takes
 * both spellings and clients still sending the French one keep working. It is required here and not
 * only in the form: a permanent erasure must not be able to start from a call made by mistake.
 */
const CONFIRMATION_WORDS = ["SUPPRIMER", "DELETE"] as const;

const eraseSchema = z.object({ confirm: z.enum(CONFIRMATION_WORDS) });

const guildParamsSchema = z.object({ guildId: z.string().regex(/^\d{17,20}$/) });

/** Null when the confirmation is there, otherwise the key of the error to answer with. */
function confirmationError(body: unknown): string | null {
  return eraseSchema.safeParse(body).success ? null : "errors.data.confirmationMissing";
}

/**
 * Personal data of the signed-in user: reading, export and erasure, without going through a mail
 * request. Everything is framed by the session - we only ever read and erase the account making
 * the request, or a server it really administrates.
 */
export default async function personalDataRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me/data", { preHandler: authenticate }, async (request) => {
    const { userId, username, avatar, email, manageableGuilds } = request.user;

    const [data, storedGuilds] = await Promise.all([
      exportUserData(userId),
      listStoredGuilds(manageableGuilds.map((guild) => guild.id)),
    ]);

    // The name the bot knows can be stale; the session one comes from Discord at sign-in.
    const sessionNames = new Map(manageableGuilds.map((guild) => [guild.id, guild.name]));

    return {
      // Taken from the session: this comes from Discord and lives in the cookie, not in the
      // database. Showing it here avoids suggesting it is stored.
      account: {
        userId,
        username,
        avatar,
        email,
        manageableGuilds: manageableGuilds.map((guild) => ({ id: guild.id, name: guild.name })),
      },
      data,
      guilds: storedGuilds.map((guild) => ({
        ...guild,
        name: sessionNames.get(guild.guildId) ?? guild.name,
      })),
    };
  });

  app.delete("/me/data", { preHandler: authenticate }, async (request, reply) => {
    const errorKey = confirmationError(request.body);
    if (errorKey) return reply.status(400).send({ error: request.t(errorKey) });

    const { userId } = request.user;
    const summary = await eraseOwnUserData(userId);

    request.log.info({ userId }, "Data erasure requested by the user themselves");

    // The session carries the account name, avatar and address: keeping it open after an erasure
    // would hold on to what was just deleted. So we sign the user out.
    return reply.clearCookie(SESSION_COOKIE, { path: "/" }).send({ erased: true, summary });
  });

  // Data of the servers the user administrates. `requireGuildAccess` only accepts servers where
  // the account holds MANAGE_GUILD on Discord, so an ordinary member cannot erase a configuration.

  app.get<{ Params: { guildId: string } }>(
    "/me/guilds/:guildId/data",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request, reply) => {
      const parsed = guildParamsSchema.safeParse(request.params);
      if (!parsed.success) {
        return reply.status(400).send({ error: request.t("errors.guild.invalid") });
      }

      return getGuildDataSummary(parsed.data.guildId);
    },
  );

  app.delete<{ Params: { guildId: string } }>(
    "/me/guilds/:guildId/data",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request, reply) => {
      const parsed = guildParamsSchema.safeParse(request.params);
      if (!parsed.success) {
        return reply.status(400).send({ error: request.t("errors.guild.invalid") });
      }

      const errorKey = confirmationError(request.body);
      if (errorKey) return reply.status(400).send({ error: request.t(errorKey) });

      const summary = await eraseGuildData(parsed.data.guildId);

      request.log.info(
        { userId: request.user.userId, guildId: parsed.data.guildId },
        "Server data erasure requested by one of its administrators",
      );

      return { erased: true, summary };
    },
  );
}
