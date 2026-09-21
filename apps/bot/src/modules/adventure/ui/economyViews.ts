import { StringSelectMenuBuilder } from "discord.js";
import {
  adventureUpgradeCost,
  adventureUpgradeSuffix,
  ADVENTURE_MAX_UPGRADE,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { Colors } from "../../../client/Constants";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";
import {
  findItem,
  itemDescription,
  itemLabel,
  itemName,
  RARITY_EMOJIS,
  shopItems,
  slotLabel,
  type ItemDefinition,
} from "../data/items";
import { recipesForLevel } from "../data/recipes";
import type { InventoryEntry } from "../services/inventory/inventoryService";
import { checkbox, formatNumber, gold } from "./format";
import { appendRow, exploreButton, navigationRow, withSelect } from "./navigation";

const MAX_SELECT_OPTIONS = 25;

function describeBonus(item: ItemDefinition, t: Translator): string {
  if (!item.bonus) return itemDescription(t, item.id);
  const parts = [
    item.bonus.attack ? `⚔️ +${item.bonus.attack}` : null,
    item.bonus.power ? `🔮 +${item.bonus.power}` : null,
    item.bonus.defense ? `🛡️ +${item.bonus.defense}` : null,
    item.bonus.maxHp ? `❤️ +${item.bonus.maxHp}` : null,
    item.bonus.crit ? `💥 +${item.bonus.crit} %` : null,
    item.bonus.dodge ? `🌀 +${item.bonus.dodge} %` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

/** Inventory grouped by item nature, with an action menu on the usable items. */
export function inventoryView(
  character: AdventureCharacter,
  entries: InventoryEntry[],
  t: Translator,
): V2MessagePayload {
  const groups: { title: string; kinds: InventoryEntry["item"]["kind"][] }[] = [
    { title: t("adventure.views.bag.groups.gear"), kinds: ["EQUIPEMENT"] },
    { title: t("adventure.views.bag.groups.consumables"), kinds: ["CONSOMMABLE"] },
    { title: t("adventure.views.bag.groups.materials"), kinds: ["MATERIAU"] },
    { title: t("adventure.views.bag.groups.treasures"), kinds: ["TRESOR", "RELIQUE"] },
  ];

  const sections = groups.flatMap(({ title, kinds }) => {
    const rows = entries.filter((entry) => kinds.includes(entry.item.kind));
    if (rows.length === 0) return [];

    const list = rows
      .map((entry) =>
        t("adventure.views.bag.row", {
          rarity: RARITY_EMOJIS[entry.item.rarity],
          item: itemLabel(t, entry.item.id),
          upgrade: adventureUpgradeSuffix(entry.row.upgradeLevel),
          quantity: entry.row.quantity > 1 ? ` ×${entry.row.quantity}` : "",
          slot: entry.item.slot
            ? t("adventure.views.bag.slot", { slot: slotLabel(t, entry.item.slot) })
            : "",
          worn: entry.row.equipped ? t("adventure.views.bag.worn") : "",
        }),
      )
      .join("\n");

    return [`**${title}**\n${list}`];
  });

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Primary, [
      t("adventure.views.bag.title", {
        name: character.username ?? t("adventure.views.unnamed"),
      }),
      t("adventure.views.bag.purse", {
        gold: gold(t, character.gold),
        echoes: formatNumber(t, character.echoes),
      }),
      ...(sections.length > 0 ? sections : [t("adventure.views.bag.empty")]),
      t("adventure.views.bag.hint"),
    ]),
  );

  navigationRow(payload, t, character.userId, ["profile", "shop", "forge", "trades"]);
  appendRow(payload, [exploreButton(t, character.userId)]);

  const usable = entries.filter(
    (entry) => entry.item.slot !== undefined || entry.item.kind === "CONSOMMABLE",
  );
  if (usable.length === 0) return payload;

  const select = new StringSelectMenuBuilder()
    .setCustomId(`adventure:item:${character.userId}`)
    .setPlaceholder(t("adventure.views.bag.select"))
    .addOptions(
      usable.slice(0, MAX_SELECT_OPTIONS).map((entry) => ({
        label: itemName(t, entry.item.id).slice(0, 100),
        value: entry.item.id,
        description: (entry.item.slot
          ? entry.row.equipped
            ? t("adventure.views.bag.takeOff")
            : t("adventure.views.bag.equipOption", { bonus: describeBonus(entry.item, t) })
          : itemDescription(t, entry.item.id)
        ).slice(0, 100),
        emoji: entry.item.emoji,
      })),
    );

  return withSelect(payload, select);
}

export function shopView(character: AdventureCharacter, t: Translator): V2MessagePayload {
  const available = shopItems().filter((item) => (item.level ?? 1) <= character.level + 5);

  const lines = available
    .map((item) => {
      const row = t("adventure.views.shop.row", {
        rarity: RARITY_EMOJIS[item.rarity],
        item: itemLabel(t, item.id),
        price: gold(t, item.price ?? 0),
        locked:
          (item.level ?? 1) > character.level
            ? t("adventure.views.shop.locked", { level: item.level ?? 1 })
            : "",
      });
      return `${row}\n*${describeBonus(item, t)}*`;
    })
    .join("\n");

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Primary, [
      t("adventure.views.shop.title"),
      t("adventure.views.shop.purse", { gold: gold(t, character.gold) }),
      lines || t("adventure.views.shop.empty"),
      t("adventure.views.shop.hint"),
    ]),
  );

  navigationRow(payload, t, character.userId, ["profile", "bag", "forge"]);

  const buyable = available.filter((item) => (item.level ?? 1) <= character.level);
  if (buyable.length === 0) return payload;

  const select = new StringSelectMenuBuilder()
    .setCustomId(`adventure:buy:${character.userId}`)
    .setPlaceholder(t("adventure.views.shop.select"))
    .addOptions(
      buyable.slice(0, MAX_SELECT_OPTIONS).map((item) => ({
        label: t("adventure.views.shop.option", {
          name: itemName(t, item.id),
          price: formatNumber(t, item.price ?? 0),
        }).slice(0, 100),
        value: item.id,
        description: describeBonus(item, t).slice(0, 100),
        emoji: item.emoji,
      })),
    );

  return withSelect(payload, select);
}

/** Upgrade menu: one row per upgradable piece, with the cost of the next tier. */
function withUpgradeSelect(
  payload: V2MessagePayload,
  character: AdventureCharacter,
  items: AdventureItem[],
  t: Translator,
): V2MessagePayload {
  const options = items.flatMap((row) => {
    const item = findItem(row.itemId);
    if (!item?.slot || row.upgradeLevel >= ADVENTURE_MAX_UPGRADE) return [];

    const cost = adventureUpgradeCost(item, row.upgradeLevel + 1);
    if (!cost) return [];

    return [
      {
        label: t("adventure.views.forge.upgradeLabel", {
          item: itemName(t, item.id),
          current: row.upgradeLevel,
          next: row.upgradeLevel + 1,
        }).slice(0, 100),
        value: item.id,
        description: t("adventure.views.forge.upgradeOption", {
          gold: formatNumber(t, cost.gold),
          materials: cost.materials
            .map((material) =>
              t("adventure.views.forge.material", {
                quantity: material.quantity,
                item: itemName(t, material.itemId),
              }),
            )
            .join(" · "),
        }).slice(0, 100),
        emoji: item.emoji,
      },
    ];
  });

  if (options.length === 0) return payload;

  return withSelect(
    payload,
    new StringSelectMenuBuilder()
      .setCustomId(`adventure:upgrade:${character.userId}`)
      .setPlaceholder(t("adventure.views.forge.upgradeSelect"))
      .addOptions(options.slice(0, MAX_SELECT_OPTIONS)),
  );
}

/** Reminder of the upgradable pieces and the cost of the next tier, under the recipes. */
function upgradeSection(items: AdventureItem[], t: Translator): string {
  const rows = items.flatMap((row) => {
    const item = findItem(row.itemId);
    if (!item?.slot || row.upgradeLevel >= ADVENTURE_MAX_UPGRADE) return [];

    const cost = adventureUpgradeCost(item, row.upgradeLevel + 1);
    if (!cost) return [];

    return [
      t("adventure.views.forge.upgradeRow", {
        item: `${itemLabel(t, item.id)}${adventureUpgradeSuffix(row.upgradeLevel)}`,
        next: row.upgradeLevel + 1,
        gold: gold(t, cost.gold),
        materials: cost.materials
          .map((material) =>
            t("adventure.views.forge.material", {
              quantity: material.quantity,
              item: itemLabel(t, material.itemId),
            }),
          )
          .join(" · "),
      }),
    ];
  });

  return [
    t("adventure.views.forge.upgradeTitle"),
    rows.length > 0 ? rows.slice(0, 5).join("\n") : t("adventure.views.forge.upgradeEmpty"),
    t("adventure.views.forge.upgradeHint"),
  ].join("\n");
}

export function forgeView(
  character: AdventureCharacter,
  items: AdventureItem[],
  t: Translator,
): V2MessagePayload {
  const recipes = recipesForLevel(character.level);
  const owned = new Map(items.map((row) => [row.itemId, row.quantity]));

  const lines = recipes
    .map((recipe) => {
      const ingredients = recipe.ingredients
        .map((ingredient) => {
          const have = owned.get(ingredient.itemId) ?? 0;
          return t("adventure.views.forge.ingredient", {
            check: checkbox(have >= ingredient.quantity),
            quantity: ingredient.quantity,
            item: itemLabel(t, ingredient.itemId),
            owned: have,
          });
        })
        .join(" · ");
      const head = t("adventure.views.forge.recipe", {
        item: itemLabel(t, recipe.itemId),
        quantity: recipe.quantity > 1 ? ` ×${recipe.quantity}` : "",
        gold: gold(t, recipe.goldCost),
      });
      return `${head}\n${ingredients}`;
    })
    .join("\n");

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Primary, [
      t("adventure.views.forge.title"),
      t("adventure.views.forge.purse", { gold: gold(t, character.gold) }),
      lines || t("adventure.views.forge.empty"),
      upgradeSection(items, t),
    ]),
  );

  navigationRow(payload, t, character.userId, ["profile", "bag", "shop"]);
  withUpgradeSelect(payload, character, items, t);

  if (recipes.length === 0) return payload;

  const select = new StringSelectMenuBuilder()
    .setCustomId(`adventure:craft:${character.userId}`)
    .setPlaceholder(t("adventure.views.forge.select"))
    .addOptions(
      recipes.slice(0, MAX_SELECT_OPTIONS).map((recipe) => ({
        label: itemName(t, recipe.itemId).slice(0, 100),
        value: recipe.id,
        description: t("adventure.views.forge.option", {
          gold: formatNumber(t, recipe.goldCost),
          level: recipe.levelRequirement,
        }).slice(0, 100),
      })),
    );

  return withSelect(payload, select);
}
