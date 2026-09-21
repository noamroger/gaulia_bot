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
 * Two ways to write a balance from the admin panel: `delta` (add or remove through the dialog) or
 * `balance` (target value typed straight into the list). Exactly one of them, never both.
 */
const creditAdjustSchema = z
  .object({
    delta: z.number().int().min(-MAX_CREDIT_BALANCE).max(MAX_CREDIT_BALANCE).optional(),
    balance: z.number().int().min(0).max(MAX_CREDIT_BALANCE).optional(),
    reason: z.string().trim().max(200).optional(),
  })
  .refine(
    (value) => (value.delta === undefined) !== (value.balance === undefined),
    "Provide either delta or balance.",
  );

/**
 * Filters of the admin server list. Everything is optional and `all` means "no constraint", so a
 * URL without any parameter returns the whole list.
 */
const flagFilterSchema = z.enum(["all", "yes", "no"]).default("all");

/** Date from a day field (YYYY-MM-DD), pinned to the start or the end of the UTC day. */
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
  // A server is forced to "en" or "fr", or left on "auto" to follow the Discord locale.
  language: z.enum(["en", "fr", "auto"]).optional(),
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
 * A filter field cleared in the browser arrives as `?membersMin=`: without this cleanup the empty
 * string would become 0 (or be refused) instead of meaning "no filter".
 */
function withoutEmptyValues(query: unknown): Record<string, unknown> {
  if (typeof query !== "object" || query === null) return {};
  return Object.fromEntries(
    Object.entries(query as Record<string, unknown>).filter(([, value]) => value !== ""),
  );
}

const statsQuerySchema = z.object({
  days: z.enum(["7", "30", "90"]).default("30").transform(Number),
  /** Command categories to leave out of the statistics, comma separated. */
  exclude: z
    .string()
    .max(400)
    .optional()
    .transform((value) => (value ? value.split(",").filter(Boolean) : []))
    .pipe(z.array(z.string().regex(/^[a-z0-9-]{1,32}$/)).max(20)),
});

/** Routes restricted to OWNER_IDS (global admin panel, across every server). */
export default async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireOwner);

  app.get("/admin/guilds", async (request, reply) => {
    const parsed = guildsQuerySchema.safeParse(withoutEmptyValues(request.query));
    if (!parsed.success) {
      return reply.status(400).send({ error: request.t("errors.validation.parameters") });
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
      return reply.status(400).send({ error: request.t("errors.validation.parameters") });
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

  // Handling of erasure requests (GDPR): preview, then permanent deletion.
  app.get("/admin/data/guilds/:id", async (request, reply) => {
    const parsed = snowflakeParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: request.t("errors.validation.id") });
    }
    return getGuildDataSummary(parsed.data.id);
  });

  app.delete("/admin/data/guilds/:id", async (request, reply) => {
    const parsed = snowflakeParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: request.t("errors.validation.id") });
    }
    const summary = await eraseGuildData(parsed.data.id);
    request.log.info(
      { ownerId: request.user.userId, guildId: parsed.data.id },
      "Server data deleted",
    );
    return summary;
  });

  app.get("/admin/data/users/:id", async (request, reply) => {
    const parsed = snowflakeParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: request.t("errors.validation.id") });
    }
    return getUserDataSummary(parsed.data.id);
  });

  app.delete("/admin/data/users/:id", async (request, reply) => {
    const parsed = snowflakeParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: request.t("errors.validation.id") });
    }
    const summary = await eraseUserData(parsed.data.id);
    request.log.info({ ownerId: request.user.userId, userId: parsed.data.id }, "User data deleted");
    return summary;
  });

  // Credits: list of accounts, then an adjustment by id (panel dialog or direct edit of a row).
  app.get("/admin/credits", async () => {
    return listCreditAccounts();
  });

  app.get("/admin/credits/:userId", async (request, reply) => {
    const parsed = userIdParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: request.t("errors.validation.id") });
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
      return reply.status(400).send({ error: request.t("errors.validation.id") });
    }

    const body = creditAdjustSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: request.t("errors.validation.body") });
    }

    const { userId } = params.data;
    const { delta: requestedDelta, balance: targetBalance } = body.data;

    // A balance typed directly is turned into a delta, so the credit ledger always records a
    // movement and never an absolute value.
    let delta: number;
    if (requestedDelta !== undefined) {
      delta = requestedDelta;
    } else if (targetBalance !== undefined) {
      delta = targetBalance - (await getCreditAccount(userId)).balance;
    } else {
      return reply.status(400).send({ error: request.t("errors.validation.body") });
    }

    const account = await adjustCredits({
      userId,
      delta,
      actorId: request.user.userId,
      reason: body.data.reason ?? null,
    });

    request.log.info(
      { ownerId: request.user.userId, userId, delta, balance: account.balance },
      "Credits adjusted from the admin panel",
    );
    return account;
  });

  app.patch<{ Params: { guildId: string } }>(
    "/admin/guilds/:guildId/premium",
    async (request, reply) => {
      const parsed = setPremiumSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: request.t("errors.validation.body") });
      }

      const { premium, premiumExpiresAt } = parsed.data;
      const guild = await setGuildPremium(
        request.params.guildId,
        premium,
        premiumExpiresAt ? new Date(premiumExpiresAt) : null,
      );
      // The list expects enriched rows (counters, settings), so we answer in that same shape and
      // the table refreshes without reloading everything.
      return (await getAdminGuild(guild.id)) ?? guild;
    },
  );
}
