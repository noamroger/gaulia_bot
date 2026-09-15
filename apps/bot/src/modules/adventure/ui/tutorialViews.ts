import { ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";

import { Colors } from "../../../client/Constants";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import { CLASSES } from "../data/classes";
import { TUTORIAL_PAGES } from "../data/tutorial";
import { appendRow, navigationRow, withSelect } from "./navigation";

/**
 * Tutoriel paginé. Il s'adresse d'abord à quelqu'un qui n'a pas encore d'aventurier : la première
 * page propose alors de créer le sien d'un bouton, et les pages suivantes se feuillettent sans
 * jamais retaper de commande.
 */
export function tutorialView(
  userId: string,
  pageIndex: number,
  hasCharacter: boolean,
): V2MessagePayload {
  const index = Math.max(0, Math.min(TUTORIAL_PAGES.length - 1, pageIndex));
  const page = TUTORIAL_PAGES[index]!;

  const lines = [
    `## ${page.emoji} ${page.title}`,
    ...page.sections.map((section) => `**${section.heading}**\n${section.body}`),
    `-# Tutoriel de l'aventure · page ${index + 1} sur ${TUTORIAL_PAGES.length}`,
  ];

  const payload = toV2Payload(false, buildContainer(Colors.Primary, lines));

  appendRow(payload, [
    new ButtonBuilder()
      .setCustomId(`adventure:tuto-page:${userId}:${index - 1}`)
      .setLabel("Précédent")
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index === 0),
    new ButtonBuilder()
      .setCustomId(`adventure:tuto-page:${userId}:${index + 1}`)
      .setLabel("Suivant")
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(index === TUTORIAL_PAGES.length - 1),
  ]);

  // Sans personnage, le tutoriel sert aussi de porte d'entrée : une classe, un bouton, c'est parti.
  if (!hasCharacter) {
    appendRow(
      payload,
      CLASSES.map((definition) =>
        new ButtonBuilder()
          .setCustomId(`adventure:tuto-start:${userId}:${definition.id}`)
          .setLabel(definition.name)
          .setEmoji(definition.emoji)
          .setStyle(ButtonStyle.Success),
      ),
    );
  } else {
    navigationRow(payload, userId, ["profil", "quetes", "histoire"]);
  }

  return withSelect(
    payload,
    new StringSelectMenuBuilder()
      .setCustomId(`adventure:tuto-jump:${userId}`)
      .setPlaceholder("Aller à un chapitre du tutoriel…")
      .addOptions(
        TUTORIAL_PAGES.map((entry, position) => ({
          label: `${position + 1}. ${entry.title}`.slice(0, 100),
          value: entry.id,
          description: entry.summary.slice(0, 100),
          emoji: entry.emoji,
          default: position === index,
        })),
      ),
  );
}
