import { isAdventureItemTradable, type AdventureItem } from "@gaulia/database";
import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { successPayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";
import { findItem, itemName, ITEMS } from "../data/items";
import {
  acceptTrade,
  closeTrade,
  proposeTrade,
  requirePendingTrade,
} from "../services/economy/tradeService";
import { planUpgrade, upgradableItems, upgradeItem } from "../services/economy/upgradeService";
import { renderAdventureView } from "../ui/renderView";
import { tradeClosedView, tradeOfferView, tradeResultView, upgradeView } from "../ui/tradeViews";
import { playerContext } from "./context";

const MAX_CHOICES = 25;

/** One item per side from the command: multi lot haggling would not fit a slash command. */
export async function handleTradeOffer(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const target = interaction.options.getUser("player", true);
  const offeredItemId = interaction.options.getString("item");
  const offeredQuantity = interaction.options.getInteger("quantity") ?? 1;
  const offeredGold = interaction.options.getInteger("gold") ?? 0;
  const requestedItemId = interaction.options.getString("requested_item");
  const requestedQuantity = interaction.options.getInteger("requested_quantity") ?? 1;
  const requestedGold = interaction.options.getInteger("requested_gold") ?? 0;

  if (target.bot) throw new GauliaError("adventure.error.botTrade");

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);

  const result = await proposeTrade(
    {
      initiator: character,
      initiatorItems: items,
      targetId: target.id,
      offered: {
        items: offeredItemId ? [{ itemId: offeredItemId, quantity: offeredQuantity }] : [],
        gold: offeredGold,
      },
      requested: {
        items: requestedItemId ? [{ itemId: requestedItemId, quantity: requestedQuantity }] : [],
        gold: requestedGold,
      },
      channelId: interaction.channelId,
    },
    t,
  );

  const trade = await requirePendingTrade(result.trade.id);
  await interaction.editReply(tradeOfferView(trade, result.warnings, t));
}

export async function handleTradeList(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "trades", t));
}

/** Answer by offer number, when the original message is out of clicking range. */
export async function handleTradeAnswer(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const tradeId = interaction.options.getInteger("number", true);
  const action = interaction.options.getString("action", true);

  await interaction.deferReply();
  const { character } = await playerContext(interaction);

  if (action === "accept") {
    const result = await acceptTrade(tradeId, character.userId, t);
    await interaction.editReply(
      tradeResultView(result.trade, result.initiator, result.target, result.lostUpgrades, t),
    );
    return;
  }

  const closing = action === "decline" ? "DECLINED" : "CANCELLED";
  const trade = await closeTrade(tradeId, character.userId, closing);
  await interaction.editReply(tradeClosedView(trade, closing, t));
}

export async function handleUpgrade(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const itemId = interaction.options.getString("item", true);
  const preview = interaction.options.getBoolean("preview") ?? false;

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);

  if (preview) {
    await interaction.editReply(
      upgradeView(character, planUpgrade(character, items, itemId, t), false, t),
    );
    return;
  }

  const result = await upgradeItem(character, items, itemId, t);
  await interaction.editReply(upgradeView(result.character, result.plan, true, t));

  if (result.notices.length > 0) {
    await interaction.followUp(
      successPayload(true, t("adventure.replies.upgradeNoticeTitle"), result.notices.join("\n")),
    );
  }
}

/** Items in the bag a player can actually offer in a trade. */
export async function autocompleteTradableItems(
  interaction: AutocompleteInteraction,
  items: AdventureItem[],
  t: Translator,
): Promise<void> {
  const query = interaction.options.getFocused().toLowerCase();

  await interaction.respond(
    items
      .flatMap((row) => {
        const item = findItem(row.itemId);
        if (!item || !isAdventureItemTradable(item)) return [];
        let label = t("adventure.replies.autocompleteQuantity", {
          item: itemName(t, item.id),
          quantity: row.quantity,
        });
        if (row.equipped) label = t("adventure.replies.autocompleteWorn", { item: label });
        return label.toLowerCase().includes(query)
          ? [{ name: label.slice(0, 100), value: item.id }]
          : [];
      })
      .slice(0, MAX_CHOICES),
  );
}

/** The whole tradable catalog, to name what is asked for in return. */
export async function autocompleteTradeWishlist(
  interaction: AutocompleteInteraction,
  t: Translator,
): Promise<void> {
  const query = interaction.options.getFocused().toLowerCase();

  await interaction.respond(
    ITEMS.filter(
      (item) => isAdventureItemTradable(item) && itemName(t, item.id).toLowerCase().includes(query),
    )
      .slice(0, MAX_CHOICES)
      .map((item) => ({ name: itemName(t, item.id).slice(0, 100), value: item.id })),
  );
}

/** Upgradable pieces, with their current tier. */
export async function autocompleteUpgradable(
  interaction: AutocompleteInteraction,
  items: AdventureItem[],
  t: Translator,
): Promise<void> {
  const query = interaction.options.getFocused().toLowerCase();

  await interaction.respond(
    upgradableItems(items)
      .flatMap((row) => {
        const item = findItem(row.itemId);
        if (!item) return [];
        const label = t("adventure.replies.autocompleteUpgrade", {
          item: itemName(t, item.id),
          level: row.upgradeLevel,
        });
        return label.toLowerCase().includes(query)
          ? [{ name: label.slice(0, 100), value: item.id }]
          : [];
      })
      .slice(0, MAX_CHOICES),
  );
}
