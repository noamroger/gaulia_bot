import { CREDITS_PER_VOTE, recordVote } from "@gaulia/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { env } from "../config/env";
import { verifyTopggSignature } from "../topgg/webhookSignature";

/**
 * Corps d'une livraison top.gg (API v1). Seuls les champs utilisés sont décrits ; `passthrough`
 * laisse passer le reste pour ne pas casser si top.gg enrichit le payload.
 */
const webhookUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  avatar_url: z.string().optional().nullable(),
  /** Identifiant de l'utilisateur sur la plateforme du projet — l'ID Discord dans notre cas. */
  platform_id: z.string().optional().nullable(),
});

const voteCreateSchema = z.object({
  type: z.literal("vote.create"),
  data: z
    .object({
      id: z.string(),
      weight: z.number().int().optional(),
      created_at: z.string(),
      user: webhookUserSchema,
    })
    .passthrough(),
});

const otherEventSchema = z.object({
  type: z.enum(["webhook.test", "integration.create", "integration.delete"]),
});

const webhookSchema = z.union([voteCreateSchema, otherEventSchema]);

/**
 * Webhook des votes top.gg. Non authentifié au sens du dashboard : la confiance vient de la
 * signature HMAC calculée avec le secret de l'intégration, donc le corps brut doit être conservé
 * (un parseur JSON standard le re-sérialiserait et invaliderait la signature).
 *
 * Enregistré sans `fastify-plugin` : le parseur `application/json` ci-dessous ne s'applique qu'à
 * ce scope, les autres routes de l'API gardent le parseur par défaut.
 */
export default async function topggRoutes(app: FastifyInstance): Promise<void> {
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_request, body, done) => void done(null, body),
  );

  app.post("/topgg/webhook", async (request, reply) => {
    if (env.TOPGG_WEBHOOK_SECRET === "") {
      request.log.warn("Vote top.gg reçu alors que TOPGG_WEBHOOK_SECRET n'est pas configuré");
      return reply.status(503).send({ error: "Webhook top.gg non configuré." });
    }

    const rawBody = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0);
    const signature = verifyTopggSignature(
      rawBody,
      request.headers["x-topgg-signature"],
      env.TOPGG_WEBHOOK_SECRET,
    );

    if (!signature.valid) {
      request.log.warn({ reason: signature.reason }, "Livraison top.gg rejetée");
      return reply.status(signature.status).send({ error: signature.reason });
    }

    let payload: z.infer<typeof webhookSchema>;
    try {
      payload = webhookSchema.parse(JSON.parse(rawBody.toString("utf8")));
    } catch {
      // Signature valide mais payload inattendu (nouveau type d'événement) : inutile que top.gg
      // réessaie, on accuse réception.
      request.log.info("Livraison top.gg ignorée (type d'événement non géré)");
      return reply.status(204).send();
    }

    if (payload.type !== "vote.create") {
      request.log.info({ type: payload.type }, "Événement top.gg reçu");
      return reply.status(204).send();
    }

    const { id, weight, created_at: createdAt, user } = payload.data;

    // Le compte du dashboard est un compte Discord : sans ID Discord, impossible de rattacher les
    // crédits à quelqu'un. Renvoyer 204 évite que top.gg rejoue indéfiniment une livraison
    // qui ne pourra jamais aboutir.
    const discordUserId = user.platform_id;
    if (!discordUserId) {
      request.log.warn({ voteId: id }, "Vote top.gg sans identifiant Discord, ignoré");
      return reply.status(204).send();
    }

    const votedAt = new Date(createdAt);
    const result = await recordVote({
      voteId: id,
      userId: discordUserId,
      username: user.name ?? null,
      avatar: user.avatar_url ?? null,
      weight: weight ?? 1,
      votedAt: Number.isNaN(votedAt.getTime()) ? new Date() : votedAt,
    });

    if (result.credited) {
      request.log.info(
        { userId: discordUserId, credits: CREDITS_PER_VOTE, balance: result.balance },
        "Vote top.gg crédité",
      );
    } else {
      request.log.info({ voteId: id }, "Vote top.gg déjà traité, aucun crédit ajouté");
    }

    return reply.status(204).send();
  });
}
