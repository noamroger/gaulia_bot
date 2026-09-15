import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type MessageActionRowComponentBuilder,
  type StringSelectMenuBuilder,
} from "discord.js";

import type { V2MessagePayload } from "../../../core/ui/containers";

/**
 * Vues de l'aventure atteignables d'un simple bouton. Le composant `adventure:nav` sait toutes les
 * afficher (voir ui/renderView.ts) : ajouter une entrée ici suffit à la rendre navigable, sans
 * nouveau composant à enregistrer.
 */
export type AdventureView =
  | "profil"
  | "sac"
  | "carte"
  | "histoire"
  | "quetes"
  | "boutique"
  | "forge"
  | "donjon"
  | "classement"
  | "hauts-faits"
  | "journal"
  | "echanges";

const VIEW_BUTTONS: Readonly<Record<AdventureView, { label: string; emoji: string }>> = {
  profil: { label: "Profil", emoji: "🧝" },
  sac: { label: "Sac", emoji: "🎒" },
  carte: { label: "Carte", emoji: "🗺️" },
  histoire: { label: "Histoire", emoji: "📖" },
  quetes: { label: "Quêtes", emoji: "📜" },
  boutique: { label: "Boutique", emoji: "🏪" },
  forge: { label: "Forge", emoji: "⚒️" },
  donjon: { label: "Donjon", emoji: "🚪" },
  classement: { label: "Classement", emoji: "🏅" },
  "hauts-faits": { label: "Hauts faits", emoji: "🏆" },
  journal: { label: "Journal", emoji: "📓" },
  echanges: { label: "Échanges", emoji: "🤝" },
};

/** Bouton menant à une autre vue, rattaché à son joueur pour que personne d'autre ne l'utilise. */
export function viewButton(userId: string, view: AdventureView): ButtonBuilder {
  const { label, emoji } = VIEW_BUTTONS[view];
  return new ButtonBuilder()
    .setCustomId(`adventure:nav:${userId}:${view}`)
    .setLabel(label)
    .setEmoji(emoji)
    .setStyle(ButtonStyle.Secondary);
}

export function exploreButton(userId: string, label = "Explorer"): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(`adventure:explore:${userId}`)
    .setLabel(label)
    .setEmoji("🧭")
    .setStyle(ButtonStyle.Primary);
}

/** Ajoute une rangée de composants au premier container du payload. */
export function appendRow(
  payload: V2MessagePayload,
  components: MessageActionRowComponentBuilder[],
): V2MessagePayload {
  if (components.length === 0) return payload;

  const [container] = payload.components;
  if (container && "addActionRowComponents" in container) {
    container.addActionRowComponents(
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(components),
    );
  }
  return payload;
}

/** Rangée de navigation en bas d'une vue : cinq boutons au maximum, limite de Discord. */
export function navigationRow(
  payload: V2MessagePayload,
  userId: string,
  views: AdventureView[],
): V2MessagePayload {
  return appendRow(
    payload,
    views.slice(0, 5).map((view) => viewButton(userId, view)),
  );
}

/** Ajoute un menu déroulant sous le container (listes d'objets, de recettes, d'achats). */
export function withSelect(
  payload: V2MessagePayload,
  select: StringSelectMenuBuilder,
): V2MessagePayload {
  payload.components.push(
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(select),
  );
  return payload;
}
