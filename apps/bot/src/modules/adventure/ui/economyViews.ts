import { StringSelectMenuBuilder } from "discord.js";
import type { AdventureCharacter, AdventureItem } from "@gaulia/database";

import { Colors } from "../../../client/Constants";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import {
  itemLabel,
  RARITY_EMOJIS,
  SLOT_LABELS,
  shopItems,
  type ItemDefinition,
} from "../data/items";
import { recipesForLevel } from "../data/recipes";
import type { InventoryEntry } from "../services/inventory/inventoryService";
import { formatNumber, gold } from "./format";
import { withSelect } from "./shared";

const MAX_SELECT_OPTIONS = 25;

function describeBonus(item: ItemDefinition): string {
  if (!item.bonus) return item.description;
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

/** Inventaire groupé par nature d'objet, avec un menu d'actions sur les objets utilisables. */
export function inventoryView(
  character: AdventureCharacter,
  entries: InventoryEntry[],
): V2MessagePayload {
  const groups: { title: string; kinds: InventoryEntry["item"]["kind"][] }[] = [
    { title: "Équipement", kinds: ["EQUIPEMENT"] },
    { title: "Consommables", kinds: ["CONSOMMABLE"] },
    { title: "Matériaux", kinds: ["MATERIAU"] },
    { title: "Trésors & reliques", kinds: ["TRESOR", "RELIQUE"] },
  ];

  const sections = groups.flatMap(({ title, kinds }) => {
    const rows = entries.filter((entry) => kinds.includes(entry.item.kind));
    if (rows.length === 0) return [];

    const list = rows
      .map((entry) => {
        const equipped = entry.row.equipped ? " · **porté**" : "";
        const slot = entry.item.slot ? ` (${SLOT_LABELS[entry.item.slot]})` : "";
        const quantity = entry.row.quantity > 1 ? ` ×${entry.row.quantity}` : "";
        return `${RARITY_EMOJIS[entry.item.rarity]} ${itemLabel(entry.item.id)}${quantity}${slot}${equipped}`;
      })
      .join("\n");

    return [`**${title}**\n${list}`];
  });

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Primary, [
      `## 🎒 Sac de ${character.username ?? "l'aventurier"}`,
      `${gold(character.gold)} · 🔷 ${formatNumber(character.echoes)} fragments d'écho`,
      ...(sections.length > 0 ? sections : ["Ton sac est vide. Pars explorer !"]),
      "Équipe ou utilise un objet avec le menu ci-dessous, ou `/aventure equiper` et `/aventure utiliser`.",
    ]),
  );

  const usable = entries.filter(
    (entry) => entry.item.slot !== undefined || entry.item.kind === "CONSOMMABLE",
  );
  if (usable.length === 0) return payload;

  const select = new StringSelectMenuBuilder()
    .setCustomId(`adventure:item:${character.userId}`)
    .setPlaceholder("Équiper ou utiliser un objet…")
    .addOptions(
      usable.slice(0, MAX_SELECT_OPTIONS).map((entry) => ({
        label: entry.item.name.slice(0, 100),
        value: entry.item.id,
        description: (entry.item.slot
          ? entry.row.equipped
            ? "Déjà porté — retirer"
            : `Équiper — ${describeBonus(entry.item)}`
          : entry.item.description
        ).slice(0, 100),
        emoji: entry.item.emoji,
      })),
    );

  return withSelect(payload, select);
}

export function shopView(character: AdventureCharacter): V2MessagePayload {
  const available = shopItems().filter((item) => (item.level ?? 1) <= character.level + 5);

  const lines = available
    .map((item) => {
      const locked = (item.level ?? 1) > character.level ? ` · 🔒 niveau ${item.level}` : "";
      return `${RARITY_EMOJIS[item.rarity]} ${itemLabel(item.id)} — ${gold(item.price ?? 0)}${locked}\n*${describeBonus(item)}*`;
    })
    .join("\n");

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Primary, [
      "## 🏪 Comptoir des Semailles",
      `Ta bourse : ${gold(character.gold)}`,
      lines || "Le marchand n'a rien pour toi aujourd'hui.",
      "Achète avec le menu, ou `/aventure acheter objet:<nom> quantite:<n>`. Revends avec `/aventure vendre`.",
    ]),
  );

  const buyable = available.filter((item) => (item.level ?? 1) <= character.level);
  if (buyable.length === 0) return payload;

  const select = new StringSelectMenuBuilder()
    .setCustomId(`adventure:buy:${character.userId}`)
    .setPlaceholder("Acheter un objet…")
    .addOptions(
      buyable.slice(0, MAX_SELECT_OPTIONS).map((item) => ({
        label: `${item.name} — ${formatNumber(item.price ?? 0)} pièces`.slice(0, 100),
        value: item.id,
        description: describeBonus(item).slice(0, 100),
        emoji: item.emoji,
      })),
    );

  return withSelect(payload, select);
}

export function forgeView(character: AdventureCharacter, items: AdventureItem[]): V2MessagePayload {
  const recipes = recipesForLevel(character.level);
  const owned = new Map(items.map((row) => [row.itemId, row.quantity]));

  const lines = recipes
    .map((recipe) => {
      const ingredients = recipe.ingredients
        .map((ingredient) => {
          const have = owned.get(ingredient.itemId) ?? 0;
          const ok = have >= ingredient.quantity ? "✅" : "▫️";
          return `${ok} ${ingredient.quantity} × ${itemLabel(ingredient.itemId)} (${have})`;
        })
        .join(" · ");
      return `**${itemLabel(recipe.itemId)}**${recipe.quantity > 1 ? ` ×${recipe.quantity}` : ""} — ${gold(recipe.goldCost)}\n${ingredients}`;
    })
    .join("\n");

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Primary, [
      "## ⚒️ Forge",
      `Ta bourse : ${gold(character.gold)}`,
      lines || "Aucune recette accessible à ton niveau pour l'instant.",
    ]),
  );

  if (recipes.length === 0) return payload;

  const select = new StringSelectMenuBuilder()
    .setCustomId(`adventure:craft:${character.userId}`)
    .setPlaceholder("Forger un objet…")
    .addOptions(
      recipes.slice(0, MAX_SELECT_OPTIONS).map((recipe) => ({
        label: `${itemLabel(recipe.itemId).replace(/^\S+\s/, "")}`.slice(0, 100),
        value: recipe.id,
        description:
          `${formatNumber(recipe.goldCost)} pièces · niveau ${recipe.levelRequirement}`.slice(
            0,
            100,
          ),
      })),
    );

  return withSelect(payload, select);
}
