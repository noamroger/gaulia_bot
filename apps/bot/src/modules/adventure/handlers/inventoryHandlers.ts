import type { AdventureItem } from "@gaulia/database";
import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";

import { successPayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";
import { findItem, itemLabel, itemName } from "../data/items";
import { grantXp } from "../services/character/progressionService";
import { dispatchGameEvents } from "../services/events/eventDispatcher";
import {
  consumeItem,
  describeInventory,
  equipItem,
  unequipItem,
} from "../services/inventory/inventoryService";
import { inventoryView } from "../ui/economyViews";
import { renderAdventureView } from "../ui/renderView";
import { playerContext } from "./context";

const MAX_CHOICES = 25;

export async function handleInventory(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "bag", t));
}

export async function handleEquip(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const itemId = interaction.options.getString("item", true);

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  const alreadyWorn = items.some((row) => row.itemId === itemId && row.equipped);

  const updated = alreadyWorn
    ? await unequipItem(character.userId, itemId)
    : await equipItem(character, items, itemId, t);

  await interaction.editReply(inventoryView(character, describeInventory(updated), t));
  await interaction.followUp(
    successPayload(
      true,
      t(alreadyWorn ? "adventure.replies.unequippedTitle" : "adventure.replies.equippedTitle"),
      t(alreadyWorn ? "adventure.replies.unequippedBody" : "adventure.replies.equippedBody", {
        item: itemLabel(t, itemId),
      }),
    ),
  );
}

export async function handleUse(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const itemId = interaction.options.getString("item", true);

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  const result = await consumeItem(character, items, itemId, t);

  let current = result.character;
  if (result.xp > 0) current = (await grantXp(current, result.items, result.xp)).character;
  const dispatched = await dispatchGameEvents(
    current,
    result.items,
    [{ type: "POTION", amount: 1 }],
    t,
  );

  const effects = [
    result.healed > 0 ? t("adventure.replies.usedHp", { amount: result.healed }) : null,
    result.energy > 0 ? t("adventure.replies.usedEnergy", { amount: result.energy }) : null,
    result.xp > 0 ? t("adventure.replies.usedXp", { amount: result.xp }) : null,
  ].filter(Boolean);

  await interaction.editReply(
    successPayload(
      false,
      t("adventure.replies.usedTitle", { item: itemLabel(t, itemId) }),
      [effects.join(" · ") || t("adventure.replies.usedNothing"), ...dispatched.notices].join("\n"),
    ),
  );
}

/** Autocomplete of the bag, filtered by what the subcommand expects. */
export async function autocompleteInventory(
  interaction: AutocompleteInteraction,
  items: AdventureItem[],
  filter: (itemId: string) => boolean,
  t: Translator,
): Promise<void> {
  const query = interaction.options.getFocused().toLowerCase();

  const choices = items
    .filter((row) => filter(row.itemId))
    .flatMap((row) => {
      const item = findItem(row.itemId);
      if (!item) return [];
      let label = itemName(t, item.id);
      if (row.quantity > 1) {
        label = t("adventure.replies.autocompleteQuantity", {
          item: label,
          quantity: row.quantity,
        });
      }
      if (row.equipped) {
        label = t("adventure.replies.autocompleteWorn", { item: label });
      }
      return label.toLowerCase().includes(query)
        ? [{ name: label.slice(0, 100), value: item.id }]
        : [];
    })
    .slice(0, MAX_CHOICES);

  await interaction.respond(choices);
}
