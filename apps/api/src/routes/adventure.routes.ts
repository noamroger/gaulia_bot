import {
  addAdventureItem,
  addAdventureLog,
  ADVENTURE_ACTS,
  ADVENTURE_ENERGY_MAX,
  ADVENTURE_ITEMS,
  ADVENTURE_MAX_ECHOES,
  ADVENTURE_MAX_GOLD,
  ADVENTURE_MAX_ITEM_QUANTITY,
  ADVENTURE_MAX_LEVEL,
  ADVENTURE_MAX_UPGRADE,
  ADVENTURE_TOTAL_CHAPTERS,
  adventureQuestLabel,
  applyAdventureXp,
  isAdventureItemTradable,
  listPendingAdventureTrades,
  findAdventureItem,
  localized,
  getAdventurePlayerDetail,
  listAdventurePlayers,
  removeAdventureItem,
  updateAdventureCharacter,
  type AdventurePlayerDetail,
} from "@gaulia/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { authenticate } from "../plugins/authenticate";
import { requireOwner } from "../plugins/requireOwner";
import { snowflakeSchema } from "../validation/helpers";

const MAX_GRANTED_ITEMS = 20;

const playerParamsSchema = z.object({ userId: snowflakeSchema });

/**
 * Bot owner intervention in a player game. Everything is optional and only what is sent gets
 * applied. Values are deltas, except `level` which sets the level outright.
 */
const interventionSchema = z
  .object({
    xp: z.number().int().min(0).max(10_000_000).optional(),
    gold: z.number().int().min(-ADVENTURE_MAX_GOLD).max(ADVENTURE_MAX_GOLD).optional(),
    echoes: z.number().int().min(-ADVENTURE_MAX_ECHOES).max(ADVENTURE_MAX_ECHOES).optional(),
    energy: z.number().int().min(-ADVENTURE_ENERGY_MAX).max(ADVENTURE_ENERGY_MAX).optional(),
    statPoints: z.number().int().min(-500).max(500).optional(),
    level: z.number().int().min(1).max(ADVENTURE_MAX_LEVEL).optional(),
    /** Positive quantity gives items, negative takes them out of the inventory. */
    items: z
      .array(
        z.object({
          itemId: z.string().min(1).max(60),
          quantity: z
            .number()
            .int()
            .min(-ADVENTURE_MAX_ITEM_QUANTITY)
            .max(ADVENTURE_MAX_ITEM_QUANTITY)
            .refine((value) => value !== 0, "Quantity cannot be zero."),
        }),
      )
      .max(MAX_GRANTED_ITEMS)
      .optional(),
    reason: z.string().trim().max(200).optional(),
  })
  .refine(
    (value) =>
      value.xp !== undefined ||
      value.gold !== undefined ||
      value.echoes !== undefined ||
      value.energy !== undefined ||
      value.statPoints !== undefined ||
      value.level !== undefined ||
      (value.items?.length ?? 0) > 0,
    "No change requested.",
  );

/** Catalogue the admin panel needs: grantable items and the story breakdown. */
function catalogue(locale: string) {
  return {
    items: ADVENTURE_ITEMS.map((item) => ({
      id: item.id,
      name: localized(item.name, locale),
      emoji: item.emoji,
      kind: item.kind,
      rarity: item.rarity,
      slot: item.slot ?? null,
      level: item.level ?? null,
      price: item.price ?? null,
      sellPrice: item.sellPrice,
      description: localized(item.description, locale),
      tradable: isAdventureItemTradable(item),
    })),
    acts: ADVENTURE_ACTS.map((act) => ({
      id: act.id,
      title: localized(act.title, locale),
      emoji: act.emoji,
      chapters: act.chapters.map((chapter) => ({
        id: chapter.id,
        title: localized(chapter.title, locale),
        levelRequirement: chapter.levelRequirement,
        echoCost: chapter.echoCost,
      })),
    })),
    totalChapters: ADVENTURE_TOTAL_CHAPTERS,
    maxLevel: ADVENTURE_MAX_LEVEL,
    maxEnergy: ADVENTURE_ENERGY_MAX,
    maxUpgrade: ADVENTURE_MAX_UPGRADE,
  };
}

/**
 * Enriches the sheet with quest labels (only the shared catalogue knows them) and the trades still
 * open, which help make sense of a complaint about a missing item.
 */
async function withDetails(detail: AdventurePlayerDetail, locale: string) {
  const trades = await listPendingAdventureTrades(detail.character.userId);

  return {
    ...detail,
    quests: detail.quests.map((quest) => ({
      ...quest,
      label: localized(adventureQuestLabel(quest.questId, quest.target), locale),
    })),
    pendingTrades: trades.map((trade) => ({
      id: trade.id,
      initiatorId: trade.initiatorId,
      initiatorName: trade.initiator.username,
      targetId: trade.targetId,
      targetName: trade.target.username,
      offeredItems: trade.offeredItems,
      offeredGold: trade.offeredGold,
      requestedItems: trade.requestedItems,
      requestedGold: trade.requestedGold,
      expiresAt: trade.expiresAt,
    })),
  };
}

/** Readable summary of an intervention, stored in the player log (English, like the other logs). */
function describeIntervention(body: z.infer<typeof interventionSchema>): string {
  const parts: string[] = [];
  if (body.level !== undefined) parts.push(`level set to ${body.level}`);
  if (body.xp) parts.push(`+${body.xp} XP`);
  if (body.gold) parts.push(`${body.gold > 0 ? "+" : ""}${body.gold} gold`);
  if (body.echoes) parts.push(`${body.echoes > 0 ? "+" : ""}${body.echoes} echo shards`);
  if (body.energy) parts.push(`${body.energy > 0 ? "+" : ""}${body.energy} energy`);
  if (body.statPoints) {
    parts.push(`${body.statPoints > 0 ? "+" : ""}${body.statPoints} stat point(s)`);
  }
  for (const entry of body.items ?? []) {
    const item = findAdventureItem(entry.itemId);
    const label = item ? item.name.en : entry.itemId;
    parts.push(`${entry.quantity > 0 ? "+" : ""}${entry.quantity} x ${label}`);
  }

  const summary = parts.join(", ") || "no change";
  return body.reason ? `${summary} - ${body.reason}` : summary;
}

/** Admin panel of the adventure module: player follow-up and interventions in their game. */
export default async function adventureRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireOwner);

  app.get("/admin/adventure/catalogue", async (request) => catalogue(request.t.locale));

  app.get("/admin/adventure/players", async () => listAdventurePlayers());

  app.get("/admin/adventure/players/:userId", async (request, reply) => {
    const params = playerParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: request.t("errors.validation.id") });
    }

    const detail = await getAdventurePlayerDetail(params.data.userId);
    if (!detail) {
      return reply.status(404).send({ error: request.t("errors.adventure.noCharacter") });
    }
    return withDetails(detail, request.t.locale);
  });

  app.patch("/admin/adventure/players/:userId", async (request, reply) => {
    const params = playerParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: request.t("errors.validation.id") });
    }

    const body = interventionSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: request.t("errors.validation.body") });
    }

    const { userId } = params.data;
    const detail = await getAdventurePlayerDetail(userId);
    if (!detail) {
      return reply.status(404).send({ error: request.t("errors.adventure.noCharacter") });
    }

    const unknown = (body.data.items ?? []).filter((entry) => !findAdventureItem(entry.itemId));
    if (unknown.length > 0) {
      return reply.status(400).send({ error: request.t("errors.adventure.unknownItem") });
    }

    const { character } = detail;
    // XP goes through the same rule as the game, so levels rise exactly as they do in play.
    const progression = applyAdventureXp(character, body.data.xp ?? 0);

    const updated = await updateAdventureCharacter(userId, {
      level: body.data.level ?? progression.level,
      xp: body.data.level !== undefined ? 0 : progression.xp,
      totalXp: progression.totalXp,
      statPoints: Math.max(0, progression.statPoints + (body.data.statPoints ?? 0)),
      gold: Math.min(ADVENTURE_MAX_GOLD, Math.max(0, character.gold + (body.data.gold ?? 0))),
      echoes: Math.min(
        ADVENTURE_MAX_ECHOES,
        Math.max(0, character.echoes + (body.data.echoes ?? 0)),
      ),
      energy: Math.min(
        ADVENTURE_ENERGY_MAX,
        Math.max(0, character.energy + (body.data.energy ?? 0)),
      ),
    });

    for (const entry of body.data.items ?? []) {
      if (entry.quantity > 0) {
        await addAdventureItem(userId, entry.itemId, entry.quantity);
      } else {
        await removeAdventureItem(userId, entry.itemId, -entry.quantity);
      }
    }

    // Trace visible both to the player (adventure journal) and in the admin panel.
    await addAdventureLog({
      userId,
      type: "ADMIN",
      message: `Staff intervention: ${describeIntervention(body.data)}`,
      actorId: request.user.userId,
    });

    request.log.info(
      { ownerId: request.user.userId, userId, intervention: body.data },
      "Adventure game changed from the admin panel",
    );

    const refreshed = await getAdventurePlayerDetail(userId);
    return refreshed
      ? withDetails(refreshed, request.t.locale)
      : {
          character: updated,
          items: [],
          quests: [],
          achievements: [],
          logs: [],
          pendingTrades: [],
        };
  });
}
