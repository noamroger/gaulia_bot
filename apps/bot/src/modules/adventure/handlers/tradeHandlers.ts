import { isAdventureItemTradable, type AdventureItem } from "@gaulia/database";
import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { successPayload } from "../../../core/ui/containers";
import { findItem, ITEMS } from "../data/items";
import {
  acceptTrade,
  closeTrade,
  listTrades,
  proposeTrade,
  requirePendingTrade,
} from "../services/economy/tradeService";
import { planUpgrade, upgradableItems, upgradeItem } from "../services/economy/upgradeService";
import {
  tradeClosedView,
  tradeListView,
  tradeOfferView,
  tradeResultView,
  upgradeView,
} from "../ui/tradeViews";
import { playerContext } from "./context";

const MAX_CHOICES = 25;

/** Un seul objet par côté depuis la commande : la négociation à plusieurs lots passerait mal en slash. */
export async function handleTradeOffer(interaction: ChatInputCommandInteraction): Promise<void> {
  const target = interaction.options.getUser("joueur", true);
  const offeredItemId = interaction.options.getString("objet");
  const offeredQuantity = interaction.options.getInteger("quantite") ?? 1;
  const offeredGold = interaction.options.getInteger("or") ?? 0;
  const requestedItemId = interaction.options.getString("objet_demande");
  const requestedQuantity = interaction.options.getInteger("quantite_demandee") ?? 1;
  const requestedGold = interaction.options.getInteger("or_demande") ?? 0;

  if (target.bot) throw new GauliaError("Les bots ne commercent pas.");

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);

  const result = await proposeTrade({
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
  });

  const trade = await requirePendingTrade(result.trade.id);
  await interaction.editReply(tradeOfferView(trade, result.warnings));
}

export async function handleTradeList(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const { character } = await playerContext(interaction);
  await interaction.editReply(tradeListView(character.userId, await listTrades(character.userId)));
}

/** Réponse par numéro de proposition, quand le message d'origine n'est plus à portée de clic. */
export async function handleTradeAnswer(interaction: ChatInputCommandInteraction): Promise<void> {
  const tradeId = interaction.options.getInteger("numero", true);
  const action = interaction.options.getString("reponse", true);

  await interaction.deferReply();
  const { character } = await playerContext(interaction);

  if (action === "accepter") {
    const result = await acceptTrade(tradeId, character.userId);
    await interaction.editReply(
      tradeResultView(result.trade, result.initiator, result.target, result.lostUpgrades),
    );
    return;
  }

  const closing = action === "refuser" ? "DECLINED" : "CANCELLED";
  const trade = await closeTrade(tradeId, character.userId, closing);
  await interaction.editReply(tradeClosedView(trade, closing));
}

export async function handleUpgrade(interaction: ChatInputCommandInteraction): Promise<void> {
  const itemId = interaction.options.getString("objet", true);
  const preview = interaction.options.getBoolean("apercu") ?? false;

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);

  if (preview) {
    await interaction.editReply(
      upgradeView(character, planUpgrade(character, items, itemId), false),
    );
    return;
  }

  const result = await upgradeItem(character, items, itemId);
  await interaction.editReply(upgradeView(result.character, result.plan, true));

  if (result.notices.length > 0) {
    await interaction.followUp(successPayload(true, "Au passage", result.notices.join("\n")));
  }
}

/** Objets de son sac qu'un joueur peut réellement proposer à l'échange. */
export async function autocompleteTradableItems(
  interaction: AutocompleteInteraction,
  items: AdventureItem[],
): Promise<void> {
  const query = interaction.options.getFocused().toLowerCase();

  await interaction.respond(
    items
      .flatMap((row) => {
        const item = findItem(row.itemId);
        if (!item || !isAdventureItemTradable(item)) return [];
        const label = `${item.name} ×${row.quantity}${row.equipped ? " (portée)" : ""}`;
        return label.toLowerCase().includes(query)
          ? [{ name: label.slice(0, 100), value: item.id }]
          : [];
      })
      .slice(0, MAX_CHOICES),
  );
}

/** Tout le catalogue échangeable, pour désigner ce qu'on demande en retour. */
export async function autocompleteTradeWishlist(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const query = interaction.options.getFocused().toLowerCase();

  await interaction.respond(
    ITEMS.filter((item) => isAdventureItemTradable(item) && item.name.toLowerCase().includes(query))
      .slice(0, MAX_CHOICES)
      .map((item) => ({ name: item.name.slice(0, 100), value: item.id })),
  );
}

/** Pièces renforçables, avec leur palier actuel. */
export async function autocompleteUpgradable(
  interaction: AutocompleteInteraction,
  items: AdventureItem[],
): Promise<void> {
  const query = interaction.options.getFocused().toLowerCase();

  await interaction.respond(
    upgradableItems(items)
      .flatMap((row) => {
        const item = findItem(row.itemId);
        if (!item) return [];
        const label = `${item.name} +${row.upgradeLevel}`;
        return label.toLowerCase().includes(query)
          ? [{ name: label.slice(0, 100), value: item.id }]
          : [];
      })
      .slice(0, MAX_CHOICES),
  );
}
