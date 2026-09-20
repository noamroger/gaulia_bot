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
 * Mot à recopier pour confirmer une suppression. Il est exigé côté API et pas seulement dans le
 * formulaire : une suppression définitive ne doit pas pouvoir partir d'un appel fait par erreur.
 */
const CONFIRMATION_WORD = "SUPPRIMER";

const eraseSchema = z.object({
  confirm: z.literal(CONFIRMATION_WORD, {
    message: `Confirmation manquante : renvoie le mot ${CONFIRMATION_WORD}.`,
  }),
});

const guildParamsSchema = z.object({ guildId: z.string().regex(/^\d{17,20}$/) });

function confirmed(body: unknown): string | null {
  const parsed = eraseSchema.safeParse(body);
  return parsed.success ? null : (parsed.error.issues[0]?.message ?? "Confirmation manquante.");
}

/**
 * Données personnelles de l'utilisateur connecté : consultation, export et suppression, sans
 * passer par une demande par mail. Tout est cadré par la session — on ne lit et on n'efface
 * jamais que le compte qui fait la requête, ou un serveur qu'il administre réellement.
 */
export default async function personalDataRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me/data", { preHandler: authenticate }, async (request) => {
    const { userId, username, avatar, email, manageableGuilds } = request.user;

    const [data, storedGuilds] = await Promise.all([
      exportUserData(userId),
      listStoredGuilds(manageableGuilds.map((guild) => guild.id)),
    ]);

    // Le nom connu du bot peut dater ; celui de la session vient de Discord à la connexion.
    const sessionNames = new Map(manageableGuilds.map((guild) => [guild.id, guild.name]));

    return {
      // Reprise de la session : ces informations viennent de Discord et vivent dans le cookie,
      // pas en base. Les afficher ici évite de laisser croire qu'elles sont enregistrées.
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
    const error = confirmed(request.body);
    if (error) return reply.status(400).send({ error });

    const { userId } = request.user;
    const summary = await eraseOwnUserData(userId);

    request.log.info({ userId }, "Suppression des données demandée par l'utilisateur lui-même");

    // La session porte le pseudo, l'avatar et l'adresse du compte : la garder ouverte après une
    // suppression reviendrait à conserver ce qu'on vient d'effacer. On déconnecte donc.
    return reply.clearCookie(SESSION_COOKIE, { path: "/" }).send({ erased: true, summary });
  });

  // ─── Données des serveurs administrés ──────────────────────────────────────
  // `requireGuildAccess` n'accepte que les serveurs sur lesquels le compte a MANAGE_GUILD côté
  // Discord : un membre ordinaire ne peut pas effacer la configuration d'un serveur.

  app.get<{ Params: { guildId: string } }>(
    "/me/guilds/:guildId/data",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request, reply) => {
      const parsed = guildParamsSchema.safeParse(request.params);
      if (!parsed.success) return reply.status(400).send({ error: "Serveur invalide." });

      return getGuildDataSummary(parsed.data.guildId);
    },
  );

  app.delete<{ Params: { guildId: string } }>(
    "/me/guilds/:guildId/data",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request, reply) => {
      const parsed = guildParamsSchema.safeParse(request.params);
      if (!parsed.success) return reply.status(400).send({ error: "Serveur invalide." });

      const error = confirmed(request.body);
      if (error) return reply.status(400).send({ error });

      const summary = await eraseGuildData(parsed.data.guildId);

      request.log.info(
        { userId: request.user.userId, guildId: parsed.data.guildId },
        "Suppression des données d'un serveur demandée par un de ses administrateurs",
      );

      return { erased: true, summary };
    },
  );
}
