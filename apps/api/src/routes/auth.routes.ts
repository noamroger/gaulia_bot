import { randomBytes } from "node:crypto";

import type { FastifyInstance } from "fastify";

import { env } from "../config/env";
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchDiscordUser,
  fetchUserGuilds,
  filterManageableGuilds,
} from "../discord/discordApi";
import { logger } from "../logger";
import { authenticate } from "../plugins/authenticate";

const STATE_COOKIE = "gaulia_oauth_state";
const RETURN_COOKIE = "gaulia_oauth_return";
/** Cookie de session, aussi effacé par la suppression des données (voir personalData.routes.ts). */
export const SESSION_COOKIE = "gaulia_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
};

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { redirect?: string } }>("/auth/login", async (request, reply) => {
    const state = randomBytes(16).toString("hex");

    // Page de retour après connexion (ex: /contact). Seul un chemin interne est accepté : un `//`
    // ou une URL absolue ferait du dashboard un tremplin de redirection vers n'importe quel site.
    const requested = request.query.redirect ?? "";
    const returnPath = /^\/(?!\/)[\w\-/]*$/.test(requested) ? requested : "";

    await reply
      .setCookie(STATE_COOKIE, state, { ...cookieOptions, maxAge: 5 * 60 })
      .setCookie(RETURN_COOKIE, returnPath, { ...cookieOptions, maxAge: 5 * 60 })
      .redirect(buildAuthorizeUrl(state));
  });

  app.get<{ Querystring: { code?: string; state?: string } }>(
    "/auth/callback",
    async (request, reply) => {
      const { code, state } = request.query;
      const expectedState = request.cookies[STATE_COOKIE];
      const returnPath = request.cookies[RETURN_COOKIE] ?? "";

      reply.clearCookie(STATE_COOKIE, { path: "/" });
      reply.clearCookie(RETURN_COOKIE, { path: "/" });

      if (!code || !state || !expectedState || state !== expectedState) {
        return reply.redirect(`${env.DASHBOARD_URL}/login?error=invalid_state`);
      }

      try {
        const token = await exchangeCodeForToken(code);
        const [user, guilds] = await Promise.all([
          fetchDiscordUser(token.access_token),
          fetchUserGuilds(token.access_token),
        ]);

        const manageableGuilds = filterManageableGuilds(guilds).map((guild) => ({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
        }));

        const jwt = app.jwt.sign(
          {
            userId: user.id,
            username: user.username,
            avatar: user.avatar,
            // Discord ne renvoie l'adresse qu'avec le scope `email`, et seulement si elle est
            // vérifiée : sans elle, le formulaire de contact demandera une reconnexion.
            email: user.verified ? (user.email ?? null) : null,
            manageableGuilds,
            isOwner: env.OWNER_IDS.includes(user.id),
          },
          { expiresIn: "12h" },
        );

        return reply
          .setCookie(SESSION_COOKIE, jwt, {
            ...cookieOptions,
            maxAge: SESSION_MAX_AGE_SECONDS,
          })
          .redirect(`${env.DASHBOARD_URL}${returnPath || "/dashboard"}`);
      } catch (error) {
        logger.error({ err: error }, "Échec du callback OAuth2 Discord");
        return reply.redirect(`${env.DASHBOARD_URL}/login?error=oauth_failed`);
      }
    },
  );

  app.get("/auth/me", { preHandler: authenticate }, async (request) => {
    return request.user;
  });

  app.post("/auth/logout", async (_request, reply) => {
    return reply.clearCookie(SESSION_COOKIE, { path: "/" }).send({ ok: true });
  });
}
