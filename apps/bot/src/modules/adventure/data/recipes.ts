/** Recettes de la forge : matériaux + pièces d'or contre un objet, à partir d'un certain niveau. */

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
    id: "r-lingot",
    itemId: "lingot-fer",
    quantity: 1,
    goldCost: 20,
    levelRequirement: 5,
    ingredients: [{ itemId: "fer-brut", quantity: 3 }],
  },
  {
    id: "r-potion-mineure",
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
    id: "r-epee-fer",
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
    id: "r-arc-if",
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
    id: "r-baton-chene",
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
    id: "r-cotte",
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
    id: "r-potion-majeure",
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
    id: "r-hache",
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
    id: "r-plates",
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
    id: "r-lame-givre",
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
    id: "r-runique",
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
    id: "r-elixir",
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
    id: "r-astral",
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
    id: "r-lame-echos",
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
    id: "r-sceptre-echos",
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
    id: "r-arc-echos",
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
    id: "r-egide",
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
