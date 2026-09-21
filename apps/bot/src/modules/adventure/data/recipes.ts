/** Forge recipes: materials plus gold for an item, from a given level on. */

export interface RecipeDefinition {
  id: string;
  itemId: string;
  quantity: number;
  goldCost: number;
  levelRequirement: number;
  ingredients: { itemId: string; quantity: number }[];
}

export const RECIPES: readonly RecipeDefinition[] = [
  {
    id: "iron-ingot",
    itemId: "lingot-fer",
    quantity: 1,
    goldCost: 20,
    levelRequirement: 5,
    ingredients: [{ itemId: "fer-brut", quantity: 3 }],
  },
  {
    id: "minor-potion",
    itemId: "potion-mineure",
    quantity: 3,
    goldCost: 40,
    levelRequirement: 3,
    ingredients: [
      { itemId: "bois-noueux", quantity: 2 },
      { itemId: "peau-loup", quantity: 1 },
    ],
  },
  {
    id: "iron-sword",
    itemId: "epee-fer",
    quantity: 1,
    goldCost: 150,
    levelRequirement: 8,
    ingredients: [
      { itemId: "lingot-fer", quantity: 3 },
      { itemId: "bois-noueux", quantity: 2 },
    ],
  },
  {
    id: "yew-bow",
    itemId: "arc-if",
    quantity: 1,
    goldCost: 150,
    levelRequirement: 8,
    ingredients: [
      { itemId: "bois-noueux", quantity: 5 },
      { itemId: "fil-argent", quantity: 1 },
    ],
  },
  {
    id: "oak-staff",
    itemId: "baton-chene",
    quantity: 1,
    goldCost: 150,
    levelRequirement: 8,
    ingredients: [
      { itemId: "bois-noueux", quantity: 4 },
      { itemId: "essence-spectrale", quantity: 1 },
    ],
  },
  {
    id: "chain-mail",
    itemId: "cotte-mailles",
    quantity: 1,
    goldCost: 260,
    levelRequirement: 10,
    ingredients: [
      { itemId: "lingot-fer", quantity: 5 },
      { itemId: "peau-loup", quantity: 3 },
    ],
  },
  {
    id: "major-potion",
    itemId: "potion-majeure",
    quantity: 2,
    goldCost: 200,
    levelRequirement: 20,
    ingredients: [
      { itemId: "essence-spectrale", quantity: 2 },
      { itemId: "os-blanchi", quantity: 3 },
    ],
  },
  {
    id: "burning-axe",
    itemId: "hache-ardente",
    quantity: 1,
    goldCost: 900,
    levelRequirement: 18,
    ingredients: [
      { itemId: "lingot-fer", quantity: 8 },
      { itemId: "croc-sanglier", quantity: 4 },
    ],
  },
  {
    id: "plate-armour",
    itemId: "armure-plates",
    quantity: 1,
    goldCost: 2_400,
    levelRequirement: 25,
    ingredients: [
      { itemId: "lingot-fer", quantity: 14 },
      { itemId: "ecaille-drake", quantity: 2 },
    ],
  },
  {
    id: "frost-blade",
    itemId: "lame-givre",
    quantity: 1,
    goldCost: 3_000,
    levelRequirement: 30,
    ingredients: [
      { itemId: "ecaille-drake", quantity: 5 },
      { itemId: "coeur-elementaire", quantity: 1 },
    ],
  },
  {
    id: "runic-armour",
    itemId: "armure-runique",
    quantity: 1,
    goldCost: 7_000,
    levelRequirement: 40,
    ingredients: [
      { itemId: "ecaille-drake", quantity: 8 },
      { itemId: "fil-argent", quantity: 6 },
      { itemId: "coeur-elementaire", quantity: 2 },
    ],
  },
  {
    id: "supreme-elixir",
    itemId: "elixir-supreme",
    quantity: 2,
    goldCost: 1_200,
    levelRequirement: 45,
    ingredients: [
      { itemId: "poudre-astrale", quantity: 2 },
      { itemId: "essence-spectrale", quantity: 5 },
    ],
  },
  {
    id: "astral-harness",
    itemId: "harnois-astral",
    quantity: 1,
    goldCost: 18_000,
    levelRequirement: 60,
    ingredients: [
      { itemId: "poudre-astrale", quantity: 10 },
      { itemId: "coeur-elementaire", quantity: 5 },
    ],
  },
  {
    id: "echo-blade",
    itemId: "lame-echos",
    quantity: 1,
    goldCost: 60_000,
    levelRequirement: 80,
    ingredients: [
      { itemId: "eclat-echo", quantity: 4 },
      { itemId: "poudre-astrale", quantity: 20 },
      { itemId: "coeur-elementaire", quantity: 10 },
    ],
  },
  {
    id: "echo-sceptre",
    itemId: "sceptre-echos",
    quantity: 1,
    goldCost: 60_000,
    levelRequirement: 80,
    ingredients: [
      { itemId: "eclat-echo", quantity: 4 },
      { itemId: "poudre-astrale", quantity: 20 },
      { itemId: "essence-spectrale", quantity: 20 },
    ],
  },
  {
    id: "echo-bow",
    itemId: "arc-echos",
    quantity: 1,
    goldCost: 60_000,
    levelRequirement: 80,
    ingredients: [
      { itemId: "eclat-echo", quantity: 4 },
      { itemId: "poudre-astrale", quantity: 20 },
      { itemId: "fil-argent", quantity: 20 },
    ],
  },
  {
    id: "echo-aegis",
    itemId: "egide-echos",
    quantity: 1,
    goldCost: 75_000,
    levelRequirement: 80,
    ingredients: [
      { itemId: "eclat-echo", quantity: 6 },
      { itemId: "ecaille-drake", quantity: 25 },
    ],
  },
] as const;

export function findRecipe(recipeId: string): RecipeDefinition | undefined {
  return RECIPES.find((recipe) => recipe.id === recipeId);
}

export function recipesForLevel(level: number): RecipeDefinition[] {
  return RECIPES.filter((recipe) => recipe.levelRequirement <= level);
}
