import {
  ActionRowBuilder,
  ButtonBuilder,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";
import type { MessageActionRowComponentBuilder } from "discord.js";

import { Colors, Emojis } from "../../client/Constants";

export interface V2MessagePayload {
  components: (ContainerBuilder | ActionRowBuilder<MessageActionRowComponentBuilder>)[];
  flags: MessageFlags.IsComponentsV2;
}

/**
 * Construit un container Components V2 à partir de lignes de texte (markdown), séparées
 * par un séparateur fin. C'est le bloc de base de toute l'UI de Gaulia — jamais d'EmbedBuilder.
 */
export function buildContainer(color: number, lines: string[]): ContainerBuilder {
  const container = new ContainerBuilder().setAccentColor(color);

  lines.forEach((line, index) => {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(line));
    if (index < lines.length - 1) {
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false),
      );
    }
  });

  return container;
}

export function addActionRow(
  container: ContainerBuilder,
  buttons: ButtonBuilder[],
): ContainerBuilder {
  return container.addActionRowComponents(
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(buttons),
  );
}

/** Emballe un ou plusieurs containers/rows dans le payload de message Components V2 final. */
export function toV2Payload(
  ephemeral: boolean,
  ...components: (ContainerBuilder | ActionRowBuilder<MessageActionRowComponentBuilder>)[]
): V2MessagePayload {
  return {
    components,
    flags: MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0),
  };
}

function titledLines(emoji: string, title: string, description?: string): string[] {
  const lines = [`### ${emoji} ${title}`];
  if (description) lines.push(description);
  return lines;
}

export function successPayload(
  ephemeral: boolean,
  title: string,
  description?: string,
): V2MessagePayload {
  return toV2Payload(
    ephemeral,
    buildContainer(Colors.Success, titledLines(Emojis.Success, title, description)),
  );
}

export function errorPayload(
  ephemeral: boolean,
  title: string,
  description?: string,
): V2MessagePayload {
  return toV2Payload(
    ephemeral,
    buildContainer(Colors.Danger, titledLines(Emojis.Error, title, description)),
  );
}

export function warningPayload(
  ephemeral: boolean,
  title: string,
  description?: string,
): V2MessagePayload {
  return toV2Payload(
    ephemeral,
    buildContainer(Colors.Warning, titledLines(Emojis.Warning, title, description)),
  );
}

export function infoPayload(
  ephemeral: boolean,
  title: string,
  description?: string,
): V2MessagePayload {
  return toV2Payload(
    ephemeral,
    buildContainer(Colors.Primary, titledLines(Emojis.Info, title, description)),
  );
}
