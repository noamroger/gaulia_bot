import {
  removeAdventureItem,
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import { itemLabel } from "../../data/items";
import { findRecipe, type RecipeDefinition } from "../../data/recipes";
import { dispatchGameEvents } from "../events/eventDispatcher";
import { countItem, grantItems } from "../inventory/inventoryService";

export interface CraftResult {
  character: AdventureCharacter;
  recipe: RecipeDefinition;
  notices: string[];
}

/** Forge un objet : niveau requis, ingrédients complets et or disponible, puis production. */
export async function craft(
  character: AdventureCharacter,
  items: AdventureItem[],
  recipeId: string,
): Promise<CraftResult> {
  const recipe = findRecipe(recipeId);
  if (!recipe) throw new GauliaError("Cette recette n'existe pas.");

  if (character.level < recipe.levelRequirement) {
    throw new GauliaError(
      `Cette recette demande le niveau ${recipe.levelRequirement} (tu es niveau ${character.level}).`,
    );
  }
  if (character.gold < recipe.goldCost) {
    throw new GauliaError(
      `Il te manque ${recipe.goldCost - character.gold} pièces pour payer la forge.`,
    );
  }

  const missing = recipe.ingredients.filter(
    (ingredient) => countItem(items, ingredient.itemId) < ingredient.quantity,
  );
  if (missing.length > 0) {
    throw new GauliaError(
      `Il te manque : ${missing.map((entry) => `${entry.quantity} × ${itemLabel(entry.itemId)}`).join(", ")}.`,
    );
  }

  for (const ingredient of recipe.ingredients) {
    await removeAdventureItem(character.userId, ingredient.itemId, ingredient.quantity);
  }
  await grantItems(character.userId, [{ itemId: recipe.itemId, quantity: recipe.quantity }]);

  const updated = await updateAdventureCharacter(character.userId, {
    gold: character.gold - recipe.goldCost,
  });
  const dispatched = await dispatchGameEvents(updated, items, [
    { type: "CRAFT", itemId: recipe.itemId, amount: recipe.quantity },
    { type: "GOLD_SPENT", amount: recipe.goldCost },
  ]);

  return { character: dispatched.character, recipe, notices: dispatched.notices };
}
