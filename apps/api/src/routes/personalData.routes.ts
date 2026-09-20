import { eraseUserData, exportUserData } from "@gaulia/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { authenticate } from "../plugins/authenticate";
import { SESSION_COOKIE } from "./auth.routes";

/**
 * Mot à recopier pour confirmer la suppression. Il est exigé côté API et pas seulement dans le
 * formulaire : une suppression définitive ne doit pas pouvoir partir d'un appel fait par erreur.
 */
const CONFIRMATION_WORD = "SUPPRIMER";

const eraseSchema = z.object({
  confirm: z.literal(CONFIRMATION_WORD, {
    message: `Confirmation manquante : renvoie le mot ${CONFIRMATION_WORD}.`,
  }),
});

/**
 * Données personnelles de l'utilisateur connecté : consultation, export et suppression, sans
 * passer par une demande par mail. Tout est cadré par la session — on ne lit et on n'efface
 * jamais que le compte qui fait la requête, jamais un identifiant fourni dans l'URL.
 */
export default async function personalDataRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me/data", { preHandler: authenticate }, async (request) => {
    const { userId, username, avatar, email, manageableGuilds } = request.user;

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
      data: await exportUserData(userId),
    };
  });

  app.delete("/me/data", { preHandler: authenticate }, async (request, reply) => {
    const parsed = eraseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: parsed.error.issues[0]?.message ?? "Confirmation manquante.",
      });
    }

    const { userId } = request.user;
    const summary = await eraseUserData(userId);

    request.log.info({ userId }, "Suppression des données demandée par l'utilisateur lui-même");

    // La session porte le pseudo, l'avatar et l'adresse du compte : la garder ouverte après une
    // suppression reviendrait à conserver ce qu'on vient d'effacer. On déconnecte donc.
    return reply.clearCookie(SESSION_COOKIE, { path: "/" }).send({ erased: true, summary });
  });
}
