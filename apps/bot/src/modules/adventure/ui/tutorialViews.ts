import { ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";

import { Colors } from "../../../client/Constants";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";
import { CLASSES, className } from "../data/classes";
import { TUTORIAL_PAGES, tutorialVars } from "../data/tutorial";
import { appendRow, navigationRow, withSelect } from "./navigation";

/**
 * Paginated tutorial. It speaks first to someone who has no adventurer yet: the first page then
 * offers to create one with a button, and the following pages leaf through without ever retyping a
 * command.
 */
export function tutorialView(
  userId: string,
  pageIndex: number,
  hasCharacter: boolean,
  t: Translator,
): V2MessagePayload {
  const index = Math.max(0, Math.min(TUTORIAL_PAGES.length - 1, pageIndex));
  const page = TUTORIAL_PAGES[index]!;
  const key = `adventure.tutorial.pages.${page.id}`;
  const vars = tutorialVars(t);

  const lines = [
    `## ${page.emoji} ${t(`${key}.title`)}`,
    ...page.sections.map(
      (section) =>
        `**${t(`${key}.sections.${section}.heading`)}**\n${t(`${key}.sections.${section}.body`, vars)}`,
    ),
    t("adventure.tutorial.footer", { page: index + 1, total: TUTORIAL_PAGES.length }),
  ];

  const payload = toV2Payload(false, buildContainer(Colors.Primary, lines));

  appendRow(payload, [
    new ButtonBuilder()
      .setCustomId(`adventure:tutorial-page:${userId}:${index - 1}`)
      .setLabel(t("adventure.tutorial.previous"))
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index === 0),
    new ButtonBuilder()
      .setCustomId(`adventure:tutorial-page:${userId}:${index + 1}`)
      .setLabel(t("adventure.tutorial.next"))
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(index === TUTORIAL_PAGES.length - 1),
  ]);

  // With no character, the tutorial doubles as the front door: one class, one button, off you go.
  if (!hasCharacter) {
    appendRow(
      payload,
      CLASSES.map((definition) =>
        new ButtonBuilder()
          .setCustomId(`adventure:tutorial-start:${userId}:${definition.id}`)
          .setLabel(className(t, definition.id))
          .setEmoji(definition.emoji)
          .setStyle(ButtonStyle.Success),
      ),
    );
  } else {
    navigationRow(payload, t, userId, ["profile", "quests", "story"]);
  }

  return withSelect(
    payload,
    new StringSelectMenuBuilder()
      .setCustomId(`adventure:tutorial-jump:${userId}`)
      .setPlaceholder(t("adventure.tutorial.jump"))
      .addOptions(
        TUTORIAL_PAGES.map((entry, position) => ({
          label: t("adventure.tutorial.option", {
            position: position + 1,
            title: t(`adventure.tutorial.pages.${entry.id}.title`),
          }).slice(0, 100),
          value: entry.id,
          description: t(`adventure.tutorial.pages.${entry.id}.summary`).slice(0, 100),
          emoji: entry.emoji,
          default: position === index,
        })),
      ),
  );
}
