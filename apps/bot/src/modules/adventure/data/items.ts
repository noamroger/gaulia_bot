/**
 * Le catalogue d'objets est défini dans `@gaulia/database` : l'API et le panel admin doivent
 * pouvoir nommer un inventaire et valider un objet offert à un joueur. Ce fichier ne fait que le
 * ré-exposer sous les noms courts utilisés par le module.
 */
export {
  ADVENTURE_ITEMS as ITEMS,
  ADVENTURE_RARITY_EMOJIS as RARITY_EMOJIS,
  ADVENTURE_SLOT_LABELS as SLOT_LABELS,
  adventureItemLabel as itemLabel,
  adventureItemsBySlot as itemsBySlot,
  adventureShopItems as shopItems,
  findAdventureItem as findItem,
  requireAdventureItem as requireItem,
  type AdventureItemBonus as ItemBonus,
  type AdventureItemDefinition as ItemDefinition,
  type AdventureItemEffect as ItemEffect,
  type AdventureItemKind as ItemKind,
  type AdventureItemRarity as ItemRarity,
  type AdventureItemSlot as ItemSlot,
} from "@gaulia/database";
