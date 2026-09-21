import { ButtonBuilder, ButtonStyle } from "discord.js";
import type { AdventureCharacter, AdventureTradeWithParties } from "@gaulia/database";
import { ADVENTURE_TRADE_MIN_LEVEL } from "@gaulia/database";

import { Colors } from "../../../client/Constants";
import {
  addActionRow,
  buildContainer,
  toV2Payload,
  type V2MessagePayload,
} from "../../../core/ui/containers";
import { formatDurationMs } from "../../../core/utils/duration";
import type { Translator } from "../../../i18n";
import { itemLabel, itemName } from "../data/items";
import { tradeSides, type TradeSide } from "../services/economy/tradeService";
import { formatNumber } from "./format";
import { navigationRow } from "./navigation";

function sideLines(side: TradeSide, t: Translator): string {
  const parts = side.items.map((entry) =>
    t("adventure.views.trade.entry", {
      quantity: entry.quantity,
      item: itemLabel(t, entry.itemId),
    }),
  );
  if (side.gold > 0) {
    parts.push(t("adventure.views.trade.coins", { gold: formatNumber(t, side.gold) }));
  }
  return parts.join("\n") || t("adventure.views.trade.nothing");
}

function tradeBlock(trade: AdventureTradeWithParties, t: Translator): string {
  const { offered, requested } = tradeSides(trade);
  const unnamed = t("adventure.views.unnamed");
  return [
    t("adventure.views.trade.gives", {
      name: trade.initiator.username ?? unnamed,
      items: sideLines(offered, t),
    }),
    t("adventure.views.trade.gives", {
      name: trade.target.username ?? unnamed,
      items: sideLines(requested, t),
    }),
  ].join("\n\n");
}

/** Offer sent to the recipient, with the accept and decline buttons. */
export function tradeOfferView(
  trade: AdventureTradeWithParties,
  warnings: string[],
  t: Translator,
): V2MessagePayload {
  const lines = [
    t("adventure.views.trade.offerTitle"),
    t("adventure.views.trade.offerIntro", {
      initiator: trade.initiatorId,
      target: trade.targetId,
    }),
    tradeBlock(trade, t),
    t("adventure.views.trade.expires", {
      duration: formatDurationMs(trade.expiresAt.getTime() - Date.now(), t),
    }),
  ];
  if (warnings.length > 0) lines.push(`⚠️ ${warnings.join("\n⚠️ ")}`);

  const payload = toV2Payload(false, buildContainer(Colors.Premium, lines));
  const [container] = payload.components;
  if (container && "addActionRowComponents" in container) {
    addActionRow(container, [
      new ButtonBuilder()
        .setCustomId(`adventure:trade:accept:${trade.id}`)
        .setLabel(t("adventure.buttons.accept"))
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`adventure:trade:decline:${trade.id}`)
        .setLabel(t("adventure.buttons.decline"))
        .setEmoji("✖️")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`adventure:trade:cancel:${trade.id}`)
        .setLabel(t("adventure.buttons.cancel"))
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Secondary),
    ]);
  }
  return payload;
}

export function tradeResultView(
  trade: AdventureTradeWithParties,
  initiator: AdventureCharacter,
  target: AdventureCharacter,
  lostUpgrades: string[],
  t: Translator,
): V2MessagePayload {
  const unnamed = t("adventure.views.unnamed");
  const lines = [
    t("adventure.views.trade.doneTitle"),
    tradeBlock(trade, t),
    t("adventure.views.trade.purses", {
      initiator: trade.initiator.username ?? unnamed,
      initiatorGold: formatNumber(t, initiator.gold),
      target: trade.target.username ?? unnamed,
      targetGold: formatNumber(t, target.gold),
    }),
  ];
  if (lostUpgrades.length > 0) lines.push(`⚠️ ${lostUpgrades.join("\n⚠️ ")}`);

  const payload = toV2Payload(false, buildContainer(Colors.Success, lines));
  return navigationRow(payload, t, trade.targetId, ["bag", "profile"]);
}

export function tradeClosedView(
  trade: AdventureTradeWithParties,
  action: "DECLINED" | "CANCELLED",
  t: Translator,
): V2MessagePayload {
  return toV2Payload(
    false,
    buildContainer(Colors.Neutral, [
      action === "DECLINED"
        ? t("adventure.views.trade.declinedTitle")
        : t("adventure.views.trade.cancelledTitle"),
      tradeBlock(trade, t),
    ]),
  );
}

/** List of a player's open offers, received and sent. */
export function tradeListView(
  userId: string,
  trades: AdventureTradeWithParties[],
  t: Translator,
): V2MessagePayload {
  if (trades.length === 0) {
    const empty = toV2Payload(
      false,
      buildContainer(Colors.Neutral, [
        t("adventure.views.trade.emptyTitle"),
        t("adventure.views.trade.empty"),
        t("adventure.views.trade.emptyHint", { level: ADVENTURE_TRADE_MIN_LEVEL }),
      ]),
    );
    return navigationRow(empty, t, userId, ["profile", "bag", "shop"]);
  }

  const rows = trades.map((trade) => {
    const received = trade.targetId === userId;
    const other = received ? trade.initiator : trade.target;
    const { offered, requested } = tradeSides(trade);
    const mine = received ? requested : offered;
    const theirs = received ? offered : requested;

    return [
      t("adventure.views.trade.row", {
        id: trade.id,
        direction: received ? t("adventure.views.trade.received") : t("adventure.views.trade.sent"),
        name: other.username ?? t("adventure.views.unnamed"),
        duration: formatDurationMs(trade.expiresAt.getTime() - Date.now(), t),
      }),
      t("adventure.views.trade.youGive", { items: sideLines(mine, t).replace(/\n/g, " · ") }),
      t("adventure.views.trade.youGet", { items: sideLines(theirs, t).replace(/\n/g, " · ") }),
    ].join("\n");
  });

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Premium, [
      t("adventure.views.trade.listTitle"),
      rows.join("\n\n"),
      t("adventure.views.trade.hint"),
    ]),
  );
  return navigationRow(payload, t, userId, ["profile", "bag", "shop"]);
}

/** Detail of an upgrade: cost, effect and what is possibly missing. */
export function upgradeView(
  character: AdventureCharacter,
  plan: {
    item: { id: string; emoji: string };
    row: { upgradeLevel: number };
    nextLevel: number;
    cost: { gold: number; materials: { itemId: string; quantity: number }[] };
    missing: string[];
  },
  applied: boolean,
  t: Translator,
): V2MessagePayload {
  const materials = plan.cost.materials
    .map((material) =>
      t("adventure.views.upgrade.material", {
        quantity: material.quantity,
        item: itemLabel(t, material.itemId),
      }),
    )
    .join(" · ");
  const percent = Math.round(plan.nextLevel * 12);

  const lines = applied
    ? [
        t("adventure.views.upgrade.appliedTitle", {
          emoji: plan.item.emoji,
          item: itemName(t, plan.item.id),
          level: plan.nextLevel,
        }),
        t("adventure.views.upgrade.applied", { percent }),
        t("adventure.views.upgrade.paid", {
          gold: formatNumber(t, plan.cost.gold),
          materials,
        }),
        t("adventure.views.upgrade.purse", { gold: formatNumber(t, character.gold) }),
      ]
    : [
        t("adventure.views.upgrade.planTitle", {
          emoji: plan.item.emoji,
          item: itemName(t, plan.item.id),
        }),
        t("adventure.views.upgrade.plan", {
          current: plan.row.upgradeLevel,
          next: plan.nextLevel,
          percent,
        }),
        t("adventure.views.upgrade.cost", {
          gold: formatNumber(t, plan.cost.gold),
          materials,
        }),
        plan.missing.length > 0
          ? t("adventure.views.upgrade.missing", { missing: plan.missing.join(", ") })
          : t("adventure.views.upgrade.ready"),
      ];

  const payload = toV2Payload(
    false,
    buildContainer(applied ? Colors.Success : Colors.Primary, lines),
  );
  return navigationRow(payload, t, character.userId, ["forge", "bag", "profile"]);
}
