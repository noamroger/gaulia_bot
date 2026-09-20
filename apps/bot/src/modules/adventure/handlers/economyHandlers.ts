import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";

import { successPayload } from "../../../core/ui/containers";
import { findItem, itemLabel, shopItems } from "../data/items";
import { RECIPES } from "../data/recipes";
import { craft } from "../services/economy/craftService";
import { buyItem, sellItem } from "../services/economy/shopService";
import { renderAdventureView } from "../ui/renderView";
import { formatNumber, gold } from "../ui/format";
import { playerContext } from "./context";

const MAX_CHOICES = 25;

export async function handleShop(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "boutique"));
}

export async function handleBuy(interaction: ChatInputCommandInteraction): Promise<void> {
  const itemId = interaction.options.getString("objet", true);
  const quantity = interaction.options.getInteger("quantite") ?? 1;

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  const result = await buyItem(character, items, itemId, quantity);

  await interaction.editReply(
    successPayload(
      false,
      "Achat conclu",
      [
        `${quantity} × ${itemLabel(itemId)} pour ${gold(result.total)}.`,
        `Il te reste ${gold(result.character.gold)}.`,
        ...result.notices,
      ].join("\n"),
    ),
  );
}

export async function handleSell(interaction: ChatInputCommandInteraction): Promise<void> {
  const itemId = interaction.options.getString("objet", true);
  const quantity = interaction.options.getInteger("quantite") ?? 1;

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  const result = await sellItem(character, items, itemId, quantity);

  await interaction.editReply(
    successPayload(
      false,
      "Vente conclue",
      [
        `${quantity} × ${itemLabel(itemId)} vendu(s) pour ${gold(result.total)}.`,
        `Ta bourse : ${gold(result.character.gold)}.`,
        ...result.notices,
      ].join("\n"),
    ),
  );
}

export async function handleForge(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "forge"));
}

export async function handleCraft(interaction: ChatInputCommandInteraction): Promise<void> {
  const recipeId = interaction.options.getString("recette", true);

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  const result = await craft(character, items, recipeId);

  await interaction.editReply(
    successPayload(
      false,
      "Forge terminée",
      [
        `${result.recipe.quantity} × ${itemLabel(result.recipe.itemId)} sort de l'enclume.`,
        `Ta bourse : ${gold(result.character.gold)}.`,
        ...result.notices,
      ].join("\n"),
    ),
  );
}

export async function autocompleteShop(interaction: AutocompleteInteraction): Promise<void> {
  const query = interaction.options.getFocused().toLowerCase();

  await interaction.respond(
    shopItems()
      .filter((item) => item.name.toLowerCase().includes(query))
      .slice(0, MAX_CHOICES)
      .map((item) => ({
        name: `${item.name} - ${formatNumber(item.price ?? 0)} pièces`.slice(0, 100),
        value: item.id,
      })),
  );
}

export async function autocompleteRecipes(interaction: AutocompleteInteraction): Promise<void> {
  const query = interaction.options.getFocused().toLowerCase();

  await interaction.respond(
    RECIPES.filter((recipe) => (findItem(recipe.itemId)?.name ?? "").toLowerCase().includes(query))
      .slice(0, MAX_CHOICES)
      .map((recipe) => ({
        name: `${findItem(recipe.itemId)?.name ?? recipe.itemId} - niveau ${recipe.levelRequirement}`.slice(
          0,
          100,
        ),
        value: recipe.id,
      })),
  );
}
