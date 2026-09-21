import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type MessageActionRowComponentBuilder,
  type StringSelectMenuBuilder,
} from "discord.js";

import type { V2MessagePayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";

/**
 * Adventure views reachable from a single button. The `adventure:nav` component knows how to
 * render them all (see ui/renderView.ts), so adding an entry here is enough to make a view
 * navigable, with no new component to register.
 */
export type AdventureView =
  | "profile"
  | "bag"
  | "map"
  | "story"
  | "quests"
  | "shop"
  | "forge"
  | "dungeon"
  | "leaderboard"
  | "achievements"
  | "journal"
  | "trades";

const VIEW_EMOJIS: Readonly<Record<AdventureView, string>> = {
  profile: "🧝",
  bag: "🎒",
  map: "🗺️",
  story: "📖",
  quests: "📜",
  shop: "🏪",
  forge: "⚒️",
  dungeon: "🚪",
  leaderboard: "🏅",
  achievements: "🏆",
  journal: "📓",
  trades: "🤝",
};

/** Views were named in French until the English rename: panels posted before it stay usable. */
const LEGACY_VIEWS: Readonly<Record<string, AdventureView>> = {
  profil: "profile",
  sac: "bag",
  carte: "map",
  histoire: "story",
  quetes: "quests",
  boutique: "shop",
  donjon: "dungeon",
  classement: "leaderboard",
  "hauts-faits": "achievements",
  echanges: "trades",
};

/** View carried by a `adventure:nav` button, falling back on the profile when it means nothing. */
export function adventureViewOf(segment: string | undefined): AdventureView {
  if (!segment) return "profile";
  if (segment in VIEW_EMOJIS) return segment as AdventureView;
  return LEGACY_VIEWS[segment] ?? "profile";
}

/** Button to another view, tied to its player so nobody else can use it. */
export function viewButton(t: Translator, userId: string, view: AdventureView): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(`adventure:nav:${userId}:${view}`)
    .setLabel(t(`adventure.buttons.${view}`))
    .setEmoji(VIEW_EMOJIS[view])
    .setStyle(ButtonStyle.Secondary);
}

export function exploreButton(t: Translator, userId: string, label?: string): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(`adventure:explore:${userId}`)
    .setLabel(label ?? t("adventure.buttons.explore"))
    .setEmoji("🧭")
    .setStyle(ButtonStyle.Primary);
}

/** Appends a row of components to the first container of the payload. */
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

/** Navigation row at the bottom of a view: five buttons at most, a Discord limit. */
export function navigationRow(
  payload: V2MessagePayload,
  t: Translator,
  userId: string,
  views: AdventureView[],
): V2MessagePayload {
  return appendRow(
    payload,
    views.slice(0, 5).map((view) => viewButton(t, userId, view)),
  );
}

/** Adds a dropdown under the container (item, recipe and purchase lists). */
export function withSelect(
  payload: V2MessagePayload,
  select: StringSelectMenuBuilder,
): V2MessagePayload {
  payload.components.push(
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(select),
  );
  return payload;
}
