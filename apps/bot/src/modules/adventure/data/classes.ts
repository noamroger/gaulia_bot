import type { AdventureClass } from "@gaulia/database";

export interface ClassDefinition {
  id: AdventureClass;
  name: string;
  emoji: string;
  description: string;
  /** Points de caractéristique de départ. */
  might: number;
  agility: number;
  spirit: number;
  /** Effet passif appliqué par le moteur de combat, décrit ici pour l'affichage. */
  passive: string;
  /** Objets offerts à la création. */
  startingItems: { itemId: string; quantity: number }[];
}

export const CLASSES: readonly ClassDefinition[] = [
  {
    id: "GUERRIER",
    name: "Guerrier",
    emoji: "🛡️",
    description: "Encaisse et frappe fort. Le plus simple à jouer, le plus dur à tuer.",
    might: 6,
    agility: 2,
    spirit: 1,
    passive: "Réduit de 15 % les dégâts subis.",
    startingItems: [
      { itemId: "epee-rouillee", quantity: 1 },
      { itemId: "tunique-cuir", quantity: 1 },
      { itemId: "potion-mineure", quantity: 3 },
    ],
  },
  {
    id: "MAGE",
    name: "Mage",
    emoji: "🔮",
    description: "Frappe à l'esprit plutôt qu'à la force : dégâts élevés, défense fragile.",
    might: 1,
    agility: 2,
    spirit: 6,
    passive: "Inflige 20 % de dégâts supplémentaires, mais encaisse 10 % de plus.",
    startingItems: [
      { itemId: "baton-noueux", quantity: 1 },
      { itemId: "robe-apprenti", quantity: 1 },
      { itemId: "potion-mineure", quantity: 3 },
    ],
  },
  {
    id: "RODEUR",
    name: "Rôdeur",
    emoji: "🏹",
    description: "Vif et chanceux : esquive, coups critiques et meilleures trouvailles.",
    might: 3,
    agility: 5,
    spirit: 1,
    passive: "+10 % de butin et un coup critique plus fréquent.",
    startingItems: [
      { itemId: "arc-chasse", quantity: 1 },
      { itemId: "tunique-cuir", quantity: 1 },
      { itemId: "potion-mineure", quantity: 3 },
    ],
  },
] as const;

export function classDefinition(id: AdventureClass): ClassDefinition {
  const found = CLASSES.find((entry) => entry.id === id);
  if (!found) throw new Error(`Classe d'aventure inconnue : ${id}`);
  return found;
}
