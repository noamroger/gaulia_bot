import type { AdventureItem } from "@gaulia/database";
import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";

import { successPayload } from "../../../core/ui/containers";
import { findItem, itemLabel } from "../data/items";
import { grantXp } from "../services/character/progressionService";
import { dispatchGameEvents } from "../services/events/eventDispatcher";
import {
  consumeItem,
  describeInventory,
  equipItem,
  unequipItem,
} from "../services/inventory/inventoryService";
import { inventoryView } from "../ui/economyViews";
import { renderAdventureView } from "../ui/renderView";
import { playerContext } from "./context";

const MAX_CHOICES = 25;

export async function handleInventory(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "sac"));
}

export async function handleEquip(interaction: ChatInputCommandInteraction): Promise<void> {
  const itemId = interaction.options.getString("objet", true);

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  const alreadyWorn = items.some((row) => row.itemId === itemId && row.equipped);

  const updated = alreadyWorn
    ? await unequipItem(character.userId, itemId)
    : await equipItem(character, items, itemId);

  await interaction.editReply(inventoryView(character, describeInventory(updated)));
  await interaction.followUp(
    successPayload(
      true,
      alreadyWorn ? "Pièce retirée" : "Pièce équipée",
      `${itemLabel(itemId)} ${alreadyWorn ? "retourne dans ton sac" : "est maintenant portée"}.`,
    ),
  );
}

export async function handleUse(interaction: ChatInputCommandInteraction): Promise<void> {
  const itemId = interaction.options.getString("objet", true);

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  const result = await consumeItem(character, items, itemId);

  let current = result.character;
  if (result.xp > 0) current = (await grantXp(current, result.items, result.xp)).character;
  const dispatched = await dispatchGameEvents(current, result.items, [
    { type: "POTION", amount: 1 },
  ]);

  const effects = [
    result.healed > 0 ? `❤️ +${result.healed} PV` : null,
    result.energy > 0 ? `⚡ +${result.energy} énergie` : null,
    result.xp > 0 ? `✨ +${result.xp} XP` : null,
  ].filter(Boolean);

  await interaction.editReply(
    successPayload(
      false,
      `${itemLabel(itemId)} utilisé`,
      [
        effects.join(" · ") || "Aucun effet : tout était déjà au maximum.",
        ...dispatched.notices,
      ].join("\n"),
    ),
  );
}

/** Autocomplétion des objets du sac, filtrée selon l'usage attendu par la sous-commande. */
export async function autocompleteInventory(
  interaction: AutocompleteInteraction,
  items: AdventureItem[],
  filter: (itemId: string) => boolean,
): Promise<void> {
  const query = interaction.options.getFocused().toLowerCase();

  const choices = items
    .filter((row) => filter(row.itemId))
    .flatMap((row) => {
      const item = findItem(row.itemId);
      if (!item) return [];
      const label = `${item.name}${row.quantity > 1 ? ` ×${row.quantity}` : ""}${row.equipped ? " (porté)" : ""}`;
      return label.toLowerCase().includes(query)
        ? [{ name: label.slice(0, 100), value: item.id }]
        : [];
    })
    .slice(0, MAX_CHOICES);

  await interaction.respond(choices);
}
