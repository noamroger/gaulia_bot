import {
  adjustCredits,
  eraseGuildData,
  eraseUserData,
  getCommandUsageSummary,
  getCreditAccount,
  getGuildDataSummary,
  getAdminGuild,
  getShardMetricHistory,
  getUserDataSummary,
  GUILD_PAGE_SIZE_MAX,
  listAdminGuilds,
  listCreditAccounts,
  listCreditTransactions,
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

/**
 * Filtres de la liste des serveurs du panel admin. Tout est optionnel et `all` vaut « sans
 * contrainte » : une URL sans aucun paramètre rend la liste complète, comme avant les filtres.
 */
const flagFilterSchema = z.enum(["all", "yes", "no"]).default("all");

/** Date saisie dans un champ jour (AAAA-MM-JJ), ramenée au début ou à la fin de la journée UTC. */
function dayBoundarySchema(edge: "start" | "end") {
  return z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .transform((value) =>
      value ? new Date(`${value}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}Z`) : null,
    );
}

const guildsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  premium: z.enum(["all", "active", "none", "subscription", "credits", "expiring"]).default("all"),
  language: z
    .string()
    .regex(/^[a-z]{2}(-[A-Za-z]{2})?$/)
    .optional(),
  membersMin: z.coerce.number().int().min(0).max(100_000_000).optional(),
  membersMax: z.coerce.number().int().min(0).max(100_000_000).optional(),
  createdFrom: dayBoundarySchema("start"),
  createdTo: dayBoundarySchema("end"),
  updatedFrom: dayBoundarySchema("start"),
  updatedTo: dayBoundarySchema("end"),
  icon: flagFilterSchema,
  modLog: flagFilterSchema,
  automodLog: flagFilterSchema,
  djRole: flagFilterSchema,
  musicChannel: flagFilterSchema,
  funChannels: flagFilterSchema,
  automod: flagFilterSchema,
  moderation: flagFilterSchema,
  music: flagFilterSchema,
  adventure: z.enum(["all", "enabled", "disabled", "none"]).default("all"),
  playlists: flagFilterSchema,
  cases: flagFilterSchema,
  warns: flagFilterSchema,
  sort: z
    .enum([
      "name",
      "id",
      "members",
      "language",
      "createdAt",
      "updatedAt",
      "premium",
      "subscriptionEnd",
      "creditsEnd",
      "cases",
      "warns",
      "playlists",
    ])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  perPage: z.coerce.number().int().min(1).max(GUILD_PAGE_SIZE_MAX).default(50),
});

/**
 * Un champ de filtre vidé dans le navigateur arrive en `?membersMin=` : sans ce nettoyage, la
 * chaîne vide serait convertie en 0 (ou refusée) au lieu d'être comprise comme « pas de filtre ».
 */
function withoutEmptyValues(query: unknown): Record<string, unknown> {
  if (typeof query !== "object" || query === null) return {};
  return Object.fromEntries(
    Object.entries(query as Record<string, unknown>).filter(([, value]) => value !== ""),
  );
}

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

  app.get("/admin/guilds", async (request, reply) => {
    const parsed = guildsQuerySchema.safeParse(withoutEmptyValues(request.query));
    if (!parsed.success) {
      return reply.status(400).send({ error: "Paramètres invalides." });
    }

    const filters = parsed.data;
    return listAdminGuilds({
      query: filters.q ?? null,
      premium: filters.premium,
      language: filters.language ?? null,
      membersMin: filters.membersMin ?? null,
      membersMax: filters.membersMax ?? null,
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
      updatedFrom: filters.updatedFrom,
      updatedTo: filters.updatedTo,
      icon: filters.icon,
      modLog: filters.modLog,
      automodLog: filters.automodLog,
      djRole: filters.djRole,
      musicChannel: filters.musicChannel,
      funChannels: filters.funChannels,
      automod: filters.automod,
      moderation: filters.moderation,
      music: filters.music,
      adventure: filters.adventure,
      playlists: filters.playlists,
      cases: filters.cases,
      warns: filters.warns,
      sort: filters.sort,
      order: filters.order,
      page: filters.page,
      perPage: filters.perPage,
    });
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
      const guild = await setGuildPremium(
        request.params.guildId,
        premium,
        premiumExpiresAt ? new Date(premiumExpiresAt) : null,
      );
      // La liste attend des lignes enrichies (compteurs, réglages) : on renvoie le même format
      // pour que le tableau se mette à jour sans avoir à tout recharger.
      return (await getAdminGuild(guild.id)) ?? guild;
    },
  );
}
