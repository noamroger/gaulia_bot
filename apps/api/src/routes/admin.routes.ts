import {
  adjustCredits,
  eraseGuildData,
  eraseUserData,
  getCommandUsageSummary,
  getCreditAccount,
  getGuildDataSummary,
  getShardMetricHistory,
  getUserDataSummary,
  listCreditAccounts,
  listCreditTransactions,
  listPresentGuilds,
  listShardStatuses,
  MAX_CREDIT_BALANCE,
  setGuildPremium,
} from "@gaulia/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { authenticate } from "../plugins/authenticate";
import { requireOwner } from "../plugins/requireOwner";

const SHARD_STALE_AFTER_MS = 90_000;

const setPremiumSchema = z.object({
  premium: z.boolean(),
  premiumExpiresAt: z.string().datetime().nullable().optional(),
});

const snowflakeParamsSchema = z.object({
  id: z.string().regex(/^\d{17,20}$/),
});

const userIdParamsSchema = z.object({
  userId: z.string().regex(/^\d{17,20}$/),
});

/**
 * Deux façons d'écrire un solde depuis le panel admin : `delta` (ajout/retrait via la boîte de
 * dialogue) ou `balance` (valeur cible saisie directement dans la liste). Exactement l'une des
 * deux, jamais les deux à la fois.
 */
const creditAdjustSchema = z
  .object({
    delta: z.number().int().min(-MAX_CREDIT_BALANCE).max(MAX_CREDIT_BALANCE).optional(),
    balance: z.number().int().min(0).max(MAX_CREDIT_BALANCE).optional(),
    reason: z.string().trim().max(200).optional(),
  })
  .refine(
    (value) => (value.delta === undefined) !== (value.balance === undefined),
    "Fournis soit delta, soit balance.",
  );

const statsQuerySchema = z.object({
  days: z.enum(["7", "30", "90"]).default("30").transform(Number),
  /** Catégories de commandes à retirer des statistiques, séparées par des virgules. */
  exclude: z
    .string()
    .max(400)
    .optional()
    .transform((value) => (value ? value.split(",").filter(Boolean) : []))
    .pipe(z.array(z.string().regex(/^[a-z0-9-]{1,32}$/)).max(20)),
});

/** Routes réservées aux OWNER_IDS (panel admin global, toutes guildes confondues). */
export default async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireOwner);

  app.get("/admin/guilds", async () => {
    return listPresentGuilds();
  });

  app.get("/admin/stats", async (request, reply) => {
    const parsed = statsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Paramètres invalides." });
    }

    const { days, exclude } = parsed.data;
    const [shardRows, commands, history] = await Promise.all([
      listShardStatuses(),
      getCommandUsageSummary(days, exclude),
      getShardMetricHistory(days),
    ]);

    const now = Date.now();
    const shards = shardRows.map((shard) => ({
      shardId: shard.shardId,
      guildCount: shard.guildCount,
      memberCount: shard.memberCount,
      ping: shard.ping,
      memoryMb: shard.memoryMb,
      playerCount: shard.playerCount,
      online: now - shard.updatedAt.getTime() < SHARD_STALE_AFTER_MS,
      startedAt: shard.startedAt,
      updatedAt: shard.updatedAt,
    }));
    const online = shards.filter((shard) => shard.online);
    const sumOnline = (pick: (shard: (typeof shards)[number]) => number): number =>
      online.reduce((sum, shard) => sum + pick(shard), 0);

    return {
      days,
      guildCount: sumOnline((shard) => shard.guildCount),
      memberCount: sumOnline((shard) => shard.memberCount),
      playerCount: sumOnline((shard) => shard.playerCount),
      shardCount: shards.length,
      onlineShardCount: online.length,
      averagePing:
        online.length === 0 ? null : Math.round(sumOnline((shard) => shard.ping) / online.length),
      commands,
      history,
      shards,
    };
  });

  // Traitement des demandes de suppression (RGPD) : aperçu puis suppression définitive.
  app.get("/admin/data/guilds/:id", async (request, reply) => {
    const parsed = snowflakeParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Identifiant invalide." });
    }
    return getGuildDataSummary(parsed.data.id);
  });

  app.delete("/admin/data/guilds/:id", async (request, reply) => {
    const parsed = snowflakeParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Identifiant invalide." });
    }
    const summary = await eraseGuildData(parsed.data.id);
    request.log.info(
      { ownerId: request.user.userId, guildId: parsed.data.id },
      "Données d'un serveur supprimées",
    );
    return summary;
  });

  app.get("/admin/data/users/:id", async (request, reply) => {
    const parsed = snowflakeParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Identifiant invalide." });
    }
    return getUserDataSummary(parsed.data.id);
  });

  app.delete("/admin/data/users/:id", async (request, reply) => {
    const parsed = snowflakeParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Identifiant invalide." });
    }
    const summary = await eraseUserData(parsed.data.id);
    request.log.info(
      { ownerId: request.user.userId, userId: parsed.data.id },
      "Données d'un utilisateur supprimées",
    );
    return summary;
  });

  // Crédits : liste des comptes, puis ajustement par identifiant (boîte de dialogue du panel ou
  // édition directe d'une ligne de la liste).
  app.get("/admin/credits", async () => {
    return listCreditAccounts();
  });

  app.get("/admin/credits/:userId", async (request, reply) => {
    const parsed = userIdParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Identifiant invalide." });
    }

    const [account, transactions] = await Promise.all([
      getCreditAccount(parsed.data.userId),
      listCreditTransactions(parsed.data.userId, 20),
    ]);
    return { ...account, transactions };
  });

  app.patch("/admin/credits/:userId", async (request, reply) => {
    const params = userIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Identifiant invalide." });
    }

    const body = creditAdjustSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Corps de requête invalide." });
    }

    const { userId } = params.data;
    const { delta: requestedDelta, balance: targetBalance } = body.data;

    // Édition directe du solde : convertie en variation, pour que le journal des crédits
    // enregistre toujours un mouvement et jamais une valeur absolue.
    let delta: number;
    if (requestedDelta !== undefined) {
      delta = requestedDelta;
    } else if (targetBalance !== undefined) {
      delta = targetBalance - (await getCreditAccount(userId)).balance;
    } else {
      return reply.status(400).send({ error: "Corps de requête invalide." });
    }

    const account = await adjustCredits({
      userId,
      delta,
      actorId: request.user.userId,
      reason: body.data.reason ?? null,
    });

    request.log.info(
      { ownerId: request.user.userId, userId, delta, balance: account.balance },
      "Crédits ajustés depuis le panel admin",
    );
    return account;
  });

  app.patch<{ Params: { guildId: string } }>(
    "/admin/guilds/:guildId/premium",
    async (request, reply) => {
      const parsed = setPremiumSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Corps de requête invalide." });
      }

      const { premium, premiumExpiresAt } = parsed.data;
      return setGuildPremium(
        request.params.guildId,
        premium,
        premiumExpiresAt ? new Date(premiumExpiresAt) : null,
      );
    },
  );
}
