import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";

import { successPayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";
import { findItem, itemLabel, itemName, shopItems } from "../data/items";
import { RECIPES } from "../data/recipes";
import { craft } from "../services/economy/craftService";
import { buyItem, sellItem } from "../services/economy/shopService";
import { renderAdventureView } from "../ui/renderView";
import { formatNumber, gold } from "../ui/format";
import { playerContext } from "./context";

const MAX_CHOICES = 25;

export async function handleShop(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "shop", t));
}

export async function handleBuy(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const itemId = interaction.options.getString("item", true);
  const quantity = interaction.options.getInteger("quantity") ?? 1;

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  const result = await buyItem(character, items, itemId, quantity, t);

  await interaction.editReply(
    successPayload(
      false,
      t("adventure.replies.boughtTitle"),
      [
        t("adventure.replies.boughtLine", {
          quantity,
          item: itemLabel(t, itemId),
          total: gold(t, result.total),
        }),
        t("adventure.replies.purseLeft", { gold: gold(t, result.character.gold) }),
        ...result.notices,
      ].join("\n"),
    ),
  );
}

export async function handleSell(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const itemId = interaction.options.getString("item", true);
  const quantity = interaction.options.getInteger("quantity") ?? 1;

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  const result = await sellItem(character, items, itemId, quantity, t);

  await interaction.editReply(
    successPayload(
      false,
      t("adventure.replies.soldTitle"),
      [
        t("adventure.replies.soldLine", {
          quantity,
          item: itemLabel(t, itemId),
          total: gold(t, result.total),
        }),
        t("adventure.replies.purse", { gold: gold(t, result.character.gold) }),
        ...result.notices,
      ].join("\n"),
    ),
  );
}

export async function handleForge(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "forge", t));
}

export async function handleCraft(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const recipeId = interaction.options.getString("recipe", true);

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  const result = await craft(character, items, recipeId, t);

  await interaction.editReply(
    successPayload(
      false,
      t("adventure.replies.craftedTitle"),
      [
        t("adventure.replies.craftedLine", {
          quantity: result.recipe.quantity,
          item: itemLabel(t, result.recipe.itemId),
        }),
        t("adventure.replies.purse", { gold: gold(t, result.character.gold) }),
        ...result.notices,
      ].join("\n"),
    ),
  );
}

export async function autocompleteShop(
  interaction: AutocompleteInteraction,
  t: Translator,
): Promise<void> {
  const query = interaction.options.getFocused().toLowerCase();

  await interaction.respond(
    shopItems()
      .filter((item) => itemName(t, item.id).toLowerCase().includes(query))
      .slice(0, MAX_CHOICES)
      .map((item) => ({
        name: t("adventure.replies.autocompleteShop", {
          item: itemName(t, item.id),
          price: formatNumber(t, item.price ?? 0),
        }).slice(0, 100),
        value: item.id,
      })),
  );
}

export async function autocompleteRecipes(
  interaction: AutocompleteInteraction,
  t: Translator,
): Promise<void> {
  const query = interaction.options.getFocused().toLowerCase();

  await interaction.respond(
    RECIPES.filter((recipe) => itemName(t, recipe.itemId).toLowerCase().includes(query))
      .slice(0, MAX_CHOICES)
      .map((recipe) => ({
        name: t("adventure.replies.autocompleteRecipe", {
          item: findItem(recipe.itemId) ? itemName(t, recipe.itemId) : recipe.itemId,
          level: recipe.levelRequirement,
        }).slice(0, 100),
        value: recipe.id,
      })),
  );
}
