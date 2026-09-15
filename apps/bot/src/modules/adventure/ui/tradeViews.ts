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
import { itemLabel } from "../data/items";
import { tradeSides, type TradeSide } from "../services/economy/tradeService";
import { formatDuration, formatNumber } from "./format";
import { navigationRow } from "./navigation";

function sideLines(side: TradeSide): string {
  const parts = side.items.map((entry) => `${entry.quantity} × ${itemLabel(entry.itemId)}`);
  if (side.gold > 0) parts.push(`${formatNumber(side.gold)} 🪙`);
  return parts.join("\n") || "*rien*";
}

function tradeBlock(trade: AdventureTradeWithParties): string {
  const { offered, requested } = tradeSides(trade);
  return [
    `**${trade.initiator.username ?? "Aventurier"} donne**\n${sideLines(offered)}`,
    `**${trade.target.username ?? "Aventurier"} donne**\n${sideLines(requested)}`,
  ].join("\n\n");
}

/** Proposition envoyée au destinataire, avec les boutons d'acceptation et de refus. */
export function tradeOfferView(
  trade: AdventureTradeWithParties,
  warnings: string[],
): V2MessagePayload {
  const lines = [
    "## 🤝 Proposition d'échange",
    `<@${trade.initiatorId}> propose un échange à <@${trade.targetId}>.`,
    tradeBlock(trade),
    `⏳ La proposition expire dans ${formatDuration(trade.expiresAt.getTime() - Date.now())}.`,
  ];
  if (warnings.length > 0) lines.push(`⚠️ ${warnings.join("\n⚠️ ")}`);

  const payload = toV2Payload(false, buildContainer(Colors.Premium, lines));
  const [container] = payload.components;
  if (container && "addActionRowComponents" in container) {
    addActionRow(container, [
      new ButtonBuilder()
        .setCustomId(`adventure:trade:accept:${trade.id}`)
        .setLabel("Accepter")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`adventure:trade:decline:${trade.id}`)
        .setLabel("Refuser")
        .setEmoji("✖️")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`adventure:trade:cancel:${trade.id}`)
        .setLabel("Annuler")
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
): V2MessagePayload {
  const lines = [
    "## 🤝 Échange conclu",
    tradeBlock(trade),
    `Bourses : ${trade.initiator.username ?? "l'un"} ${formatNumber(initiator.gold)} 🪙 · ${trade.target.username ?? "l'autre"} ${formatNumber(target.gold)} 🪙`,
  ];
  if (lostUpgrades.length > 0) lines.push(`⚠️ ${lostUpgrades.join("\n⚠️ ")}`);

  const payload = toV2Payload(false, buildContainer(Colors.Success, lines));
  return navigationRow(payload, trade.targetId, ["sac", "profil"]);
}

export function tradeClosedView(
  trade: AdventureTradeWithParties,
  action: "DECLINED" | "CANCELLED",
): V2MessagePayload {
  return toV2Payload(
    false,
    buildContainer(Colors.Neutral, [
      action === "DECLINED" ? "## ✖️ Proposition refusée" : "## 🗑️ Proposition annulée",
      tradeBlock(trade),
    ]),
  );
}

/** Liste des propositions ouvertes d'un joueur, reçues comme envoyées. */
export function tradeListView(
  userId: string,
  trades: AdventureTradeWithParties[],
): V2MessagePayload {
  if (trades.length === 0) {
    const empty = toV2Payload(
      false,
      buildContainer(Colors.Neutral, [
        "## 🤝 Échanges",
        "Aucune proposition en cours.",
        `Propose un échange avec \`/aventure echange proposer\` (à partir du niveau ${ADVENTURE_TRADE_MIN_LEVEL}).`,
      ]),
    );
    return navigationRow(empty, userId, ["profil", "sac", "boutique"]);
  }

  const rows = trades.map((trade) => {
    const received = trade.targetId === userId;
    const other = received ? trade.initiator : trade.target;
    const { offered, requested } = tradeSides(trade);
    const mine = received ? requested : offered;
    const theirs = received ? offered : requested;

    return [
      `**#${trade.id}** ${received ? "reçue de" : "envoyée à"} **${other.username ?? "Aventurier"}** · expire dans ${formatDuration(trade.expiresAt.getTime() - Date.now())}`,
      `Tu donnes : ${sideLines(mine).replace(/\n/g, " · ")}`,
      `Tu reçois : ${sideLines(theirs).replace(/\n/g, " · ")}`,
    ].join("\n");
  });

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Premium, [
      "## 🤝 Échanges en cours",
      rows.join("\n\n"),
      "Réponds depuis le message de la proposition, ou avec `/aventure echange repondre`.",
    ]),
  );
  return navigationRow(payload, userId, ["profil", "sac", "boutique"]);
}

/** Détail d'un renforcement : coût, effet et ce qui manque éventuellement. */
export function upgradeView(
  character: AdventureCharacter,
  plan: {
    item: { name: string; emoji: string };
    row: { upgradeLevel: number };
    nextLevel: number;
    cost: { gold: number; materials: { itemId: string; quantity: number }[] };
    missing: string[];
  },
  applied: boolean,
): V2MessagePayload {
  const materials = plan.cost.materials
    .map((material) => `${material.quantity} × ${itemLabel(material.itemId)}`)
    .join(" · ");

  const lines = applied
    ? [
        `## ⚒️ ${plan.item.emoji} ${plan.item.name} +${plan.nextLevel}`,
        `Renforcement réussi : les bonus de la pièce passent à **+${Math.round(plan.nextLevel * 12)} %**.`,
        `Coût payé : ${formatNumber(plan.cost.gold)} 🪙 · ${materials}`,
        `Ta bourse : ${formatNumber(character.gold)} 🪙`,
      ]
    : [
        `## ⚒️ Renforcer ${plan.item.emoji} ${plan.item.name}`,
        `Palier actuel : **+${plan.row.upgradeLevel}** → **+${plan.nextLevel}** (bonus de la pièce +${Math.round(plan.nextLevel * 12)} %)`,
        `Coût : ${formatNumber(plan.cost.gold)} 🪙 · ${materials}`,
        plan.missing.length > 0
          ? `❌ Il te manque ${plan.missing.join(", ")}.`
          : "✅ Tu as tout ce qu'il faut : `/aventure renforcer objet:<pièce>` pour lancer la forge.",
      ];

  const payload = toV2Payload(
    false,
    buildContainer(applied ? Colors.Success : Colors.Primary, lines),
  );
  return navigationRow(payload, character.userId, ["forge", "sac", "profil"]);
}
