import {
  addAdventureLog,
  applyAdventureTrade,
  ADVENTURE_MAX_PENDING_TRADES,
  ADVENTURE_TRADE_EXPIRY_MS,
  ADVENTURE_TRADE_MAX_ITEMS,
  ADVENTURE_TRADE_MIN_LEVEL,
  countPendingAdventureTrades,
  createAdventureTrade,
  expireAdventureTrades,
  getAdventureCharacter,
  getAdventureTrade,
  isAdventureItemTradable,
  listAdventureItems,
  listPendingAdventureTrades,
  parseAdventureTradeItems,
  resolveAdventureTrade,
  type AdventureCharacter,
  type AdventureItem,
  type AdventureTrade,
  type AdventureTradeItems,
  type AdventureTradeWithParties,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import { itemLabel, requireItem } from "../../data/items";
import { countItem } from "../inventory/inventoryService";

export interface TradeSide {
  items: AdventureTradeItems;
  gold: number;
}

/** Les deux lots d'une proposition, relus depuis le JSON stocké. */
export function tradeSides(trade: AdventureTrade): { offered: TradeSide; requested: TradeSide } {
  return {
    offered: { items: parseAdventureTradeItems(trade.offeredItems), gold: trade.offeredGold },
    requested: {
      items: parseAdventureTradeItems(trade.requestedItems),
      gold: trade.requestedGold,
    },
  };
}

/** Un objet doit exister, être marqué échangeable, et ne pas être porté par son propriétaire. */
function assertTradableItems(items: AdventureTradeItems): void {
  for (const entry of items) {
    const item = requireItem(entry.itemId);
    if (!isAdventureItemTradable(item)) {
      throw new GauliaError(
        `${itemLabel(entry.itemId)} ne s'échange pas : c'est une pièce liée à ton histoire.`,
      );
    }
  }
}

/**
 * Vérifie qu'un joueur peut réellement livrer sa part. Appelé à la proposition (pour prévenir tôt)
 * puis de nouveau à l'acceptation : entre les deux, un sac a pu se vider.
 */
function assertCanDeliver(
  character: AdventureCharacter,
  items: AdventureItem[],
  side: TradeSide,
  who: "toi" | "l'autre aventurier",
): void {
  if (character.gold < side.gold) {
    throw new GauliaError(
      who === "toi"
        ? `Il te manque ${side.gold - character.gold} pièces pour cet échange.`
        : "L'autre aventurier n'a plus assez de pièces pour cet échange.",
    );
  }

  for (const entry of side.items) {
    const row = items.find((value) => value.itemId === entry.itemId);
    if (!row || row.quantity < entry.quantity) {
      throw new GauliaError(
        who === "toi"
          ? `Tu ne possèdes pas ${entry.quantity} × ${itemLabel(entry.itemId)}.`
          : `L'autre aventurier n'a plus ${entry.quantity} × ${itemLabel(entry.itemId)}.`,
      );
    }
    if (row.equipped && row.quantity === entry.quantity) {
      throw new GauliaError(
        who === "toi"
          ? `${itemLabel(entry.itemId)} est équipée : retire-la avant de l'échanger.`
          : "L'autre aventurier porte l'une des pièces promises.",
      );
    }
  }
}

/** Renforcements qui disparaîtront en donnant le dernier exemplaire d'une pièce. */
function upgradeWarnings(items: AdventureItem[], side: TradeSide): string[] {
  return side.items.flatMap((entry) => {
    const row = items.find((value) => value.itemId === entry.itemId);
    return row && row.upgradeLevel > 0 && row.quantity === entry.quantity
      ? [`${itemLabel(entry.itemId)} +${row.upgradeLevel} : le renforcement sera perdu.`]
      : [];
  });
}

export interface ProposeTradeInput {
  initiator: AdventureCharacter;
  initiatorItems: AdventureItem[];
  targetId: string;
  offered: TradeSide;
  requested: TradeSide;
  channelId: string | null;
}

export interface ProposeTradeResult {
  trade: AdventureTrade;
  target: AdventureCharacter;
  warnings: string[];
}

/**
 * Crée une proposition. Rien n'est prélevé ici : l'échange n'existe qu'à l'acceptation, ce qui
 * laisse les deux joueurs libres de continuer à jouer entre-temps.
 */
export async function proposeTrade(input: ProposeTradeInput): Promise<ProposeTradeResult> {
  const { initiator, initiatorItems, targetId, offered, requested } = input;

  if (targetId === initiator.userId) {
    throw new GauliaError("Tu ne peux pas commercer avec toi-même.");
  }
  if (
    offered.items.length === 0 &&
    offered.gold === 0 &&
    requested.items.length === 0 &&
    requested.gold === 0
  ) {
    throw new GauliaError(
      "Une proposition vide n'a pas grand intérêt : ajoute un objet ou de l'or.",
    );
  }
  if (
    offered.items.length > ADVENTURE_TRADE_MAX_ITEMS ||
    requested.items.length > ADVENTURE_TRADE_MAX_ITEMS
  ) {
    throw new GauliaError(
      `Un échange porte sur ${ADVENTURE_TRADE_MAX_ITEMS} objets au maximum par côté.`,
    );
  }
  if (initiator.level < ADVENTURE_TRADE_MIN_LEVEL) {
    throw new GauliaError(
      `Les échanges s'ouvrent au niveau ${ADVENTURE_TRADE_MIN_LEVEL} (tu es niveau ${initiator.level}).`,
    );
  }

  const target = await getAdventureCharacter(targetId);
  if (!target) {
    throw new GauliaError("Ce membre n'a pas encore d'aventurier : il ne peut rien échanger.");
  }
  if (target.level < ADVENTURE_TRADE_MIN_LEVEL) {
    throw new GauliaError(
      `Cet aventurier doit atteindre le niveau ${ADVENTURE_TRADE_MIN_LEVEL} avant de pouvoir échanger.`,
    );
  }

  assertTradableItems(offered.items);
  assertTradableItems(requested.items);
  assertCanDeliver(initiator, initiatorItems, offered, "toi");

  await expireAdventureTrades();
  if ((await countPendingAdventureTrades(initiator.userId)) >= ADVENTURE_MAX_PENDING_TRADES) {
    throw new GauliaError(
      `Tu as déjà ${ADVENTURE_MAX_PENDING_TRADES} propositions en attente : annule-en une avec \`/aventure echanges\`.`,
    );
  }

  const trade = await createAdventureTrade({
    initiatorId: initiator.userId,
    targetId,
    offeredItems: offered.items,
    offeredGold: offered.gold,
    requestedItems: requested.items,
    requestedGold: requested.gold,
    channelId: input.channelId,
    expiresAt: new Date(Date.now() + ADVENTURE_TRADE_EXPIRY_MS),
  });

  return { trade, target, warnings: upgradeWarnings(initiatorItems, offered) };
}

/** Proposition encore ouverte, ou erreur explicite (expirée, déjà traitée, inconnue). */
export async function requirePendingTrade(tradeId: number): Promise<AdventureTradeWithParties> {
  await expireAdventureTrades();

  const trade = await getAdventureTrade(tradeId);
  if (!trade) throw new GauliaError("Cette proposition d'échange n'existe plus.");
  if (trade.status === "EXPIRED") throw new GauliaError("Cette proposition a expiré.");
  if (trade.status !== "PENDING") throw new GauliaError("Cette proposition a déjà été traitée.");
  return trade;
}

export interface AcceptTradeResult {
  trade: AdventureTradeWithParties;
  initiator: AdventureCharacter;
  target: AdventureCharacter;
  lostUpgrades: string[];
}

/** Vérifie une dernière fois les deux sacs, puis transfère tout d'un bloc. */
export async function acceptTrade(tradeId: number, accepterId: string): Promise<AcceptTradeResult> {
  const trade = await requirePendingTrade(tradeId);
  if (trade.targetId !== accepterId) {
    throw new GauliaError("Cette proposition ne t'est pas adressée.");
  }

  const { offered, requested } = tradeSides(trade);
  const [initiatorItems, targetItems] = await Promise.all([
    listAdventureItems(trade.initiatorId),
    listAdventureItems(trade.targetId),
  ]);

  assertCanDeliver(trade.initiator, initiatorItems, offered, "l'autre aventurier");
  assertCanDeliver(trade.target, targetItems, requested, "toi");

  const lostUpgrades = [
    ...upgradeWarnings(initiatorItems, offered),
    ...upgradeWarnings(targetItems, requested),
  ];

  await applyAdventureTrade({
    tradeId: trade.id,
    initiatorId: trade.initiatorId,
    targetId: trade.targetId,
    initiatorGoldDelta: requested.gold - offered.gold,
    targetGoldDelta: offered.gold - requested.gold,
    removals: [
      ...offered.items.map((entry) => ({ userId: trade.initiatorId, ...entry })),
      ...requested.items.map((entry) => ({ userId: trade.targetId, ...entry })),
    ],
    additions: [
      ...offered.items.map((entry) => ({ userId: trade.targetId, ...entry })),
      ...requested.items.map((entry) => ({ userId: trade.initiatorId, ...entry })),
    ],
  });

  const summary = describeTrade(trade);
  await Promise.all([
    addAdventureLog({
      userId: trade.initiatorId,
      type: "TRADE",
      message: `Échange avec ${trade.target.username ?? trade.targetId} : ${summary}`,
    }),
    addAdventureLog({
      userId: trade.targetId,
      type: "TRADE",
      message: `Échange avec ${trade.initiator.username ?? trade.initiatorId} : ${summary}`,
    }),
  ]);

  const [initiator, target] = await Promise.all([
    getAdventureCharacter(trade.initiatorId),
    getAdventureCharacter(trade.targetId),
  ]);
  if (!initiator || !target) throw new GauliaError("L'échange a échoué, réessaie.");

  return { trade, initiator, target, lostUpgrades };
}

/** Refus par le destinataire, ou annulation par l'auteur de la proposition. */
export async function closeTrade(
  tradeId: number,
  userId: string,
  action: "DECLINED" | "CANCELLED",
): Promise<AdventureTradeWithParties> {
  const trade = await requirePendingTrade(tradeId);

  const allowed = action === "DECLINED" ? trade.targetId : trade.initiatorId;
  if (allowed !== userId) {
    throw new GauliaError("Cette proposition ne t'appartient pas.");
  }
  if (!(await resolveAdventureTrade(tradeId, action))) {
    throw new GauliaError("Cette proposition vient d'être traitée.");
  }
  return trade;
}

export async function listTrades(userId: string): Promise<AdventureTradeWithParties[]> {
  await expireAdventureTrades();
  return listPendingAdventureTrades(userId);
}

/** Résumé d'une proposition en une ligne (journal, confirmation). */
export function describeTrade(trade: AdventureTrade): string {
  const { offered, requested } = tradeSides(trade);
  const side = (value: TradeSide): string => {
    const parts = value.items.map((entry) => `${entry.quantity} × ${itemLabel(entry.itemId)}`);
    if (value.gold > 0) parts.push(`${value.gold} 🪙`);
    return parts.join(" + ") || "rien";
  };
  return `${side(offered)} contre ${side(requested)}`;
}

/** Quantité détenue, utilisée par l'autocomplétion pour ne proposer que le possible. */
export function ownedQuantity(items: AdventureItem[], itemId: string): number {
  return countItem(items, itemId);
}
