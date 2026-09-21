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
import { absentUserTranslator, type Translator } from "../../../../i18n";
import { itemLabel, requireItem } from "../../data/items";
import { countItem } from "../inventory/inventoryService";

export interface TradeSide {
  items: AdventureTradeItems;
  gold: number;
}

/** The two lots of an offer, read back from the stored JSON. */
export function tradeSides(trade: AdventureTrade): { offered: TradeSide; requested: TradeSide } {
  return {
    offered: { items: parseAdventureTradeItems(trade.offeredItems), gold: trade.offeredGold },
    requested: {
      items: parseAdventureTradeItems(trade.requestedItems),
      gold: trade.requestedGold,
    },
  };
}

/** An item must exist, be flagged tradable, and not be worn by its owner. */
function assertTradableItems(items: AdventureTradeItems, t: Translator): void {
  for (const entry of items) {
    const item = requireItem(entry.itemId);
    if (!isAdventureItemTradable(item)) {
      throw new GauliaError("adventure.error.tradeBound", { item: itemLabel(t, entry.itemId) });
    }
  }
}

/**
 * Checks that a player can actually deliver their side. Called when the offer is made (to warn
 * early) and again on acceptance: a bag may have emptied in between.
 */
function assertCanDeliver(
  character: AdventureCharacter,
  items: AdventureItem[],
  side: TradeSide,
  self: boolean,
  t: Translator,
): void {
  if (character.gold < side.gold) {
    throw new GauliaError(self ? "adventure.error.tradeGold" : "adventure.error.tradeOtherGold", {
      missing: side.gold - character.gold,
    });
  }

  for (const entry of side.items) {
    const row = items.find((value) => value.itemId === entry.itemId);
    if (!row || row.quantity < entry.quantity) {
      throw new GauliaError(
        self ? "adventure.error.tradeItems" : "adventure.error.tradeOtherItems",
        { quantity: entry.quantity, item: itemLabel(t, entry.itemId) },
      );
    }
    if (row.equipped && row.quantity === entry.quantity) {
      throw new GauliaError(
        self ? "adventure.error.tradeEquipped" : "adventure.error.tradeOtherEquipped",
        { item: itemLabel(t, entry.itemId) },
      );
    }
  }
}

/** Upgrades that will vanish when the last copy of a piece is given away. */
function upgradeWarnings(items: AdventureItem[], side: TradeSide, t: Translator): string[] {
  return side.items.flatMap((entry) => {
    const row = items.find((value) => value.itemId === entry.itemId);
    return row && row.upgradeLevel > 0 && row.quantity === entry.quantity
      ? [
          t("adventure.notices.upgradeAtRisk", {
            item: itemLabel(t, entry.itemId),
            level: row.upgradeLevel,
          }),
        ]
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
 * Creates an offer. Nothing is taken here: the trade only happens on acceptance, which leaves both
 * players free to keep playing in the meantime.
 */
export async function proposeTrade(
  input: ProposeTradeInput,
  t: Translator,
): Promise<ProposeTradeResult> {
  const { initiator, initiatorItems, targetId, offered, requested } = input;

  if (targetId === initiator.userId) {
    throw new GauliaError("adventure.error.tradeSelf");
  }
  if (
    offered.items.length === 0 &&
    offered.gold === 0 &&
    requested.items.length === 0 &&
    requested.gold === 0
  ) {
    throw new GauliaError("adventure.error.tradeEmpty");
  }
  if (
    offered.items.length > ADVENTURE_TRADE_MAX_ITEMS ||
    requested.items.length > ADVENTURE_TRADE_MAX_ITEMS
  ) {
    throw new GauliaError("adventure.error.tradeTooManyItems", {
      max: ADVENTURE_TRADE_MAX_ITEMS,
    });
  }
  if (initiator.level < ADVENTURE_TRADE_MIN_LEVEL) {
    throw new GauliaError("adventure.error.tradeLevel", {
      required: ADVENTURE_TRADE_MIN_LEVEL,
      current: initiator.level,
    });
  }

  const target = await getAdventureCharacter(targetId);
  if (!target) {
    throw new GauliaError("adventure.error.targetNoCharacter");
  }
  if (target.level < ADVENTURE_TRADE_MIN_LEVEL) {
    throw new GauliaError("adventure.error.targetLevel", { required: ADVENTURE_TRADE_MIN_LEVEL });
  }

  assertTradableItems(offered.items, t);
  assertTradableItems(requested.items, t);
  assertCanDeliver(initiator, initiatorItems, offered, true, t);

  await expireAdventureTrades();
  if ((await countPendingAdventureTrades(initiator.userId)) >= ADVENTURE_MAX_PENDING_TRADES) {
    throw new GauliaError("adventure.error.tradePending", { max: ADVENTURE_MAX_PENDING_TRADES });
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

  return { trade, target, warnings: upgradeWarnings(initiatorItems, offered, t) };
}

/** An offer still open, or an explicit error (expired, already handled, unknown). */
export async function requirePendingTrade(tradeId: number): Promise<AdventureTradeWithParties> {
  await expireAdventureTrades();

  const trade = await getAdventureTrade(tradeId);
  if (!trade) throw new GauliaError("adventure.error.tradeGone");
  if (trade.status === "EXPIRED") throw new GauliaError("adventure.error.tradeExpired");
  if (trade.status !== "PENDING") throw new GauliaError("adventure.error.tradeHandled");
  return trade;
}

export interface AcceptTradeResult {
  trade: AdventureTradeWithParties;
  initiator: AdventureCharacter;
  target: AdventureCharacter;
  lostUpgrades: string[];
}

/** Checks both bags one last time, then moves everything in a single step. */
export async function acceptTrade(
  tradeId: number,
  accepterId: string,
  t: Translator,
): Promise<AcceptTradeResult> {
  const trade = await requirePendingTrade(tradeId);
  if (trade.targetId !== accepterId) {
    throw new GauliaError("adventure.error.tradeNotForYou");
  }

  const { offered, requested } = tradeSides(trade);
  const [initiatorItems, targetItems] = await Promise.all([
    listAdventureItems(trade.initiatorId),
    listAdventureItems(trade.targetId),
  ]);

  assertCanDeliver(trade.initiator, initiatorItems, offered, false, t);
  assertCanDeliver(trade.target, targetItems, requested, true, t);

  const lostUpgrades = [
    ...upgradeWarnings(initiatorItems, offered, t),
    ...upgradeWarnings(targetItems, requested, t),
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

  // Each journal entry is written in the language of the player who will read it. Only the
  // accepting side is interacting, so the other one falls back on their stored choice.
  const initiatorTranslator = await absentUserTranslator(trade.initiatorId);
  await Promise.all([
    addAdventureLog({
      userId: trade.initiatorId,
      type: "TRADE",
      message: initiatorTranslator("adventure.views.trade.logEntry", {
        name: trade.target.username ?? trade.targetId,
        summary: describeTrade(trade, initiatorTranslator),
      }),
    }),
    addAdventureLog({
      userId: trade.targetId,
      type: "TRADE",
      message: t("adventure.views.trade.logEntry", {
        name: trade.initiator.username ?? trade.initiatorId,
        summary: describeTrade(trade, t),
      }),
    }),
  ]);

  const [initiator, target] = await Promise.all([
    getAdventureCharacter(trade.initiatorId),
    getAdventureCharacter(trade.targetId),
  ]);
  if (!initiator || !target) throw new GauliaError("adventure.error.tradeFailed");

  return { trade, initiator, target, lostUpgrades };
}

/** Declined by the recipient, or cancelled by the author of the offer. */
export async function closeTrade(
  tradeId: number,
  userId: string,
  action: "DECLINED" | "CANCELLED",
): Promise<AdventureTradeWithParties> {
  const trade = await requirePendingTrade(tradeId);

  const allowed = action === "DECLINED" ? trade.targetId : trade.initiatorId;
  if (allowed !== userId) {
    throw new GauliaError("adventure.error.tradeNotYours");
  }
  if (!(await resolveAdventureTrade(tradeId, action))) {
    throw new GauliaError("adventure.error.tradeJustHandled");
  }
  return trade;
}

export async function listTrades(userId: string): Promise<AdventureTradeWithParties[]> {
  await expireAdventureTrades();
  return listPendingAdventureTrades(userId);
}

/** One line summary of an offer (journal, confirmation). */
export function describeTrade(trade: AdventureTrade, t: Translator): string {
  const { offered, requested } = tradeSides(trade);
  const side = (value: TradeSide): string => {
    const parts = value.items.map((entry) =>
      t("adventure.views.trade.entry", {
        quantity: entry.quantity,
        item: itemLabel(t, entry.itemId),
      }),
    );
    if (value.gold > 0) parts.push(t("adventure.views.trade.coins", { gold: value.gold }));
    return parts.join(" + ") || t("adventure.views.trade.summaryNothing");
  };
  return t("adventure.views.trade.summary", {
    offered: side(offered),
    requested: side(requested),
  });
}

/** Quantity held, used by the autocomplete to only offer what is possible. */
export function ownedQuantity(items: AdventureItem[], itemId: string): number {
  return countItem(items, itemId);
}
