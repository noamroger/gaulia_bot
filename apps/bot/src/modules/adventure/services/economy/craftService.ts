import {
  listAdventureItems,
  takeAdventureItems,
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import type { Translator } from "../../../../i18n";
import { itemLabel } from "../../data/items";
import { findRecipe, type RecipeDefinition } from "../../data/recipes";
import { dispatchGameEvents } from "../events/eventDispatcher";
import { countItem, grantItems } from "../inventory/inventoryService";

export interface CraftResult {
  character: AdventureCharacter;
  recipe: RecipeDefinition;
  notices: string[];
}

function materialsError(entries: RecipeDefinition["ingredients"], t: Translator): GauliaError {
  return new GauliaError("adventure.error.recipeMaterials", {
    missing: entries
      .map((entry) =>
        t("adventure.views.forge.material", {
          quantity: entry.quantity,
          item: itemLabel(t, entry.itemId),
        }),
      )
      .join(", "),
  });
}

function assertIngredients(recipe: RecipeDefinition, items: AdventureItem[], t: Translator): void {
  const missing = recipe.ingredients.filter(
    (ingredient) => countItem(items, ingredient.itemId) < ingredient.quantity,
  );
  if (missing.length > 0) throw materialsError(missing, t);
}

/** Crafts an item: level, full ingredients and gold are checked, then the item is produced. */
export async function craft(
  character: AdventureCharacter,
  items: AdventureItem[],
  recipeId: string,
  t: Translator,
): Promise<CraftResult> {
  const recipe = findRecipe(recipeId);
  if (!recipe) throw new GauliaError("adventure.error.unknownRecipe");

  if (character.level < recipe.levelRequirement) {
    throw new GauliaError("adventure.error.recipeLevel", {
      required: recipe.levelRequirement,
      current: character.level,
    });
  }
  if (character.gold < recipe.goldCost) {
    throw new GauliaError("adventure.error.recipeGold", {
      missing: recipe.goldCost - character.gold,
    });
  }

  assertIngredients(recipe, items, t);
  // All or nothing: a bag emptied since the menu opened (another action running) consumes nothing.
  if (!(await takeAdventureItems(character.userId, recipe.ingredients))) {
    assertIngredients(recipe, await listAdventureItems(character.userId), t);
    throw materialsError(recipe.ingredients, t);
  }
  await grantItems(character.userId, [{ itemId: recipe.itemId, quantity: recipe.quantity }]);

  const updated = await updateAdventureCharacter(character.userId, {
    gold: character.gold - recipe.goldCost,
  });
  const dispatched = await dispatchGameEvents(
    updated,
    items,
    [
      { type: "CRAFT", itemId: recipe.itemId, amount: recipe.quantity },
      { type: "GOLD_SPENT", amount: recipe.goldCost },
    ],
    t,
  );

  return { character: dispatched.character, recipe, notices: dispatched.notices };
}
