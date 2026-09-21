/**
 * The item catalog lives in `@gaulia/database`: the API and the admin panel need it to name an
 * inventory and to validate an item granted to a player. It holds both languages, so this file
 * only re-exposes it under the short names the module uses and picks the reader's language.
 */
import { adventureItemLabel, findAdventureItem, localized } from "@gaulia/database";

import type { Translator } from "../../../i18n";

export {
  ADVENTURE_ITEMS as ITEMS,
  ADVENTURE_RARITY_EMOJIS as RARITY_EMOJIS,
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

export function itemName(t: Translator, itemId: string): string {
  const item = findAdventureItem(itemId);
  return item ? localized(item.name, t.locale) : itemId;
}

export function itemDescription(t: Translator, itemId: string): string {
  const item = findAdventureItem(itemId);
  return item ? localized(item.description, t.locale) : "";
}

/** Emoji plus name, the form every list and message uses. */
export function itemLabel(t: Translator, itemId: string): string {
  return adventureItemLabel(itemId, t.locale);
}

export function slotLabel(t: Translator, slot: string): string {
  return t(`adventure.slots.${slot}`);
}
