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
 * Intervention du propriétaire du bot dans la partie d'un joueur. Tout est optionnel : on
 * n'applique que ce qui est envoyé. Les valeurs sont des variations (delta), sauf `level` qui
 * fixe directement le niveau.
 */
const interventionSchema = z
  .object({
    xp: z.number().int().min(0).max(10_000_000).optional(),
    gold: z.number().int().min(-ADVENTURE_MAX_GOLD).max(ADVENTURE_MAX_GOLD).optional(),
    echoes: z.number().int().min(-ADVENTURE_MAX_ECHOES).max(ADVENTURE_MAX_ECHOES).optional(),
    energy: z.number().int().min(-ADVENTURE_ENERGY_MAX).max(ADVENTURE_ENERGY_MAX).optional(),
    statPoints: z.number().int().min(-500).max(500).optional(),
    level: z.number().int().min(1).max(ADVENTURE_MAX_LEVEL).optional(),
    /** Quantité positive : don ; négative : retrait de l'inventaire. */
    items: z
      .array(
        z.object({
          itemId: z.string().min(1).max(60),
          quantity: z
            .number()
            .int()
            .min(-ADVENTURE_MAX_ITEM_QUANTITY)
            .max(ADVENTURE_MAX_ITEM_QUANTITY)
            .refine((value) => value !== 0, "La quantité ne peut pas être nulle."),
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
    "Aucune modification demandée.",
  );

/** Catalogue nécessaire au panel admin : objets offrables et découpage du scénario. */
function catalogue() {
  return {
    items: ADVENTURE_ITEMS.map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      kind: item.kind,
      rarity: item.rarity,
      slot: item.slot ?? null,
      level: item.level ?? null,
      price: item.price ?? null,
      sellPrice: item.sellPrice,
      description: item.description,
      tradable: isAdventureItemTradable(item),
    })),
    acts: ADVENTURE_ACTS.map((act) => ({
      id: act.id,
      title: act.title,
      emoji: act.emoji,
      chapters: act.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
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
 * Enrichit la fiche : libellés de quêtes (que seul le catalogue partagé connaît) et propositions
 * d'échange encore ouvertes, utiles pour comprendre une réclamation d'objet disparu.
 */
async function withDetails(detail: AdventurePlayerDetail) {
  const trades = await listPendingAdventureTrades(detail.character.userId);

  return {
    ...detail,
    quests: detail.quests.map((quest) => ({
      ...quest,
      label: adventureQuestLabel(quest.questId, quest.target),
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

/** Résumé lisible d'une intervention, écrit dans le journal du joueur. */
function describeIntervention(body: z.infer<typeof interventionSchema>): string {
  const parts: string[] = [];
  if (body.level !== undefined) parts.push(`niveau fixé à ${body.level}`);
  if (body.xp) parts.push(`+${body.xp} XP`);
  if (body.gold) parts.push(`${body.gold > 0 ? "+" : ""}${body.gold} pièces`);
  if (body.echoes) parts.push(`${body.echoes > 0 ? "+" : ""}${body.echoes} fragments d'écho`);
  if (body.energy) parts.push(`${body.energy > 0 ? "+" : ""}${body.energy} énergie`);
  if (body.statPoints) {
    parts.push(`${body.statPoints > 0 ? "+" : ""}${body.statPoints} point(s) de caractéristique`);
  }
  for (const entry of body.items ?? []) {
    const item = findAdventureItem(entry.itemId);
    const label = item ? item.name : entry.itemId;
    parts.push(`${entry.quantity > 0 ? "+" : ""}${entry.quantity} × ${label}`);
  }

  const summary = parts.join(", ") || "aucune modification";
  return body.reason ? `${summary} — ${body.reason}` : summary;
}

/** Panel admin du module aventure : suivi des joueurs et interventions dans leur partie. */
export default async function adventureRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireOwner);

  app.get("/admin/adventure/catalogue", async () => catalogue());

  app.get("/admin/adventure/players", async () => listAdventurePlayers());

  app.get("/admin/adventure/players/:userId", async (request, reply) => {
    const params = playerParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Identifiant invalide." });
    }

    const detail = await getAdventurePlayerDetail(params.data.userId);
    if (!detail) {
      return reply.status(404).send({ error: "Ce joueur n'a pas d'aventurier." });
    }
    return withDetails(detail);
  });

  app.patch("/admin/adventure/players/:userId", async (request, reply) => {
    const params = playerParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Identifiant invalide." });
    }

    const body = interventionSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Corps de requête invalide." });
    }

    const { userId } = params.data;
    const detail = await getAdventurePlayerDetail(userId);
    if (!detail) {
      return reply.status(404).send({ error: "Ce joueur n'a pas d'aventurier." });
    }

    const unknown = (body.data.items ?? []).filter((entry) => !findAdventureItem(entry.itemId));
    if (unknown.length > 0) {
      return reply.status(400).send({ error: "Objet inconnu au catalogue." });
    }

    const { character } = detail;
    // L'expérience passe par la même règle que le jeu : les niveaux montent comme en partie.
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

    // Trace visible à la fois par le joueur (`/aventure journal`) et par le panel admin.
    await addAdventureLog({
      userId,
      type: "ADMIN",
      message: `Intervention du staff : ${describeIntervention(body.data)}`,
      actorId: request.user.userId,
    });

    request.log.info(
      { ownerId: request.user.userId, userId, intervention: body.data },
      "Partie d'aventure modifiée depuis le panel admin",
    );

    const refreshed = await getAdventurePlayerDetail(userId);
    return refreshed
      ? withDetails(refreshed)
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
