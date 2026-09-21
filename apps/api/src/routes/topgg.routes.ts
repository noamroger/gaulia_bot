import { CREDITS_PER_VOTE, recordVote } from "@gaulia/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { env } from "../config/env";
import { verifyTopggSignature } from "../topgg/webhookSignature";

/**
 * Body of a top.gg delivery (API v1). Only the fields in use are described; `passthrough` lets the
 * rest through so an enriched payload does not break parsing.
 */
const webhookUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  avatar_url: z.string().optional().nullable(),
  /** User id on the project platform, which is the Discord id for us. */
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
 * top.gg vote webhook. Not authenticated the way the dashboard is: trust comes from the HMAC
 * signature computed with the integration secret, so the raw body must be kept (a standard JSON
 * parser would re-serialise it and break the signature).
 *
 * Registered without `fastify-plugin`, so the `application/json` parser below only applies to this
 * scope and the other routes keep the default one. Replies are read by top.gg, not by a human, so
 * they stay short and in English.
 */
export default async function topggRoutes(app: FastifyInstance): Promise<void> {
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_request, body, done) => void done(null, body),
  );

  app.post("/topgg/webhook", async (request, reply) => {
    if (env.TOPGG_WEBHOOK_SECRET === "") {
      request.log.warn("top.gg vote received while TOPGG_WEBHOOK_SECRET is not configured");
      return reply.status(503).send({ error: "Webhook not configured." });
    }

    const rawBody = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0);
    const signature = verifyTopggSignature(
      rawBody,
      request.headers["x-topgg-signature"],
      env.TOPGG_WEBHOOK_SECRET,
    );

    if (!signature.valid) {
      request.log.warn({ reason: signature.reason }, "top.gg delivery rejected");
      return reply.status(signature.status).send({ error: signature.reason });
    }

    let payload: z.infer<typeof webhookSchema>;
    try {
      payload = webhookSchema.parse(JSON.parse(rawBody.toString("utf8")));
    } catch {
      // Valid signature but unexpected payload (a new event type): no point having top.gg retry,
      // so we acknowledge it.
      request.log.info("top.gg delivery ignored (unhandled event type)");
      return reply.status(204).send();
    }

    if (payload.type !== "vote.create") {
      request.log.info({ type: payload.type }, "top.gg event received");
      return reply.status(204).send();
    }

    const { id, weight, created_at: createdAt, user } = payload.data;

    // A dashboard account is a Discord account: without a Discord id the credits cannot be tied to
    // anyone. Answering 204 keeps top.gg from replaying a delivery that can never succeed.
    const discordUserId = user.platform_id;
    if (!discordUserId) {
      request.log.warn({ voteId: id }, "top.gg vote without a Discord id, ignored");
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
        "top.gg vote credited",
      );
    } else {
      request.log.info({ voteId: id }, "top.gg vote already handled, no credit added");
    }

    return reply.status(204).send();
  });
}
