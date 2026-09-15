import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type MessageActionRowComponentBuilder,
  type StringSelectMenuBuilder,
} from "discord.js";

import { addActionRow, type V2MessagePayload } from "../../../core/ui/containers";

export { checkbox, counter, formatDuration, formatNumber, gold, progressBar } from "./format";

/** Bouton « explorer encore », lié au joueur pour qu'un autre membre ne puisse pas le presser. */
export function exploreAgainButton(userId: string): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(`adventure:explore:${userId}`)
    .setLabel("Explorer encore")
    .setEmoji("🧭")
    .setStyle(ButtonStyle.Primary);
}

/** Ajoute le bouton au premier container du payload, s'il y en a un. */
export function withExploreButtonSafe(payload: V2MessagePayload, userId: string): V2MessagePayload {
  const [container] = payload.components;
  if (container && "addActionRowComponents" in container) {
    addActionRow(container, [exploreAgainButton(userId)]);
  }
  return payload;
}

/** Ajoute un menu déroulant sous le container (les listes d'objets, de recettes, d'achats). */
export function withSelect(
  payload: V2MessagePayload,
  select: StringSelectMenuBuilder,
): V2MessagePayload {
  payload.components.push(
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(select),
  );
  return payload;
}
