import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  ModalBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  TextInputStyle,
  type MessageActionRowComponentBuilder,
  type MessageMentionOptions,
} from "discord.js";

import { Colors } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";

export type FunPayload = V2MessagePayload & { allowedMentions: MessageMentionOptions };
export type FunRow = ActionRowBuilder<MessageActionRowComponentBuilder>;
export type Difficulty = "easy" | "normal" | "hard";

export const DIFFICULTY_CHOICES = [
  { name: "Facile", value: "easy" },
  { name: "Normale", value: "normal" },
  { name: "Difficile", value: "hard" },
] as const;

export const MODAL_INPUT_ID = "answer";

export function parseDifficulty(value: string | null): Difficulty {
  return value === "easy" || value === "hard" ? value : "normal";
}

export function difficultyLabel(difficulty: Difficulty): string {
  return DIFFICULTY_CHOICES.find((choice) => choice.value === difficulty)!.name.toLowerCase();
}

/** Texte et contrôles dans un même container ; seules les mentions listées notifient. */
export function funPayload(
  lines: string[],
  rows: FunRow[] = [],
  notifyUserIds: string[] = [],
): FunPayload {
  const container = new ContainerBuilder()
    .setAccentColor(Colors.Primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")));
  for (const row of rows) container.addActionRowComponents(row);

  return {
    ...toV2Payload(false, container),
    allowedMentions: { parse: [], users: notifyUserIds },
  };
}

export function funButton(
  customId: string,
  label: string,
  style: ButtonStyle = ButtonStyle.Secondary,
  disabled = false,
): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setDisabled(disabled);
}

export function funRow(...components: MessageActionRowComponentBuilder[]): FunRow {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(components);
}

export function mention(userId: string | null): string {
  return userId ? `<@${userId}>` : "Gaulia";
}

/** Découpe un customId `fun:<action>:<partie>[:<valeur>]`. */
export function parseCustomId(customId: string): { gameId: string; value: string | undefined } {
  const [, , gameId, value] = customId.split(":");
  if (!gameId) throw new GauliaError("Ce bouton n'est plus valide.");
  return { gameId, value };
}

export function textInputModal(
  customId: string,
  title: string,
  label: string,
  length: { min: number; max: number },
): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(MODAL_INPUT_ID)
          .setLabel(label)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMinLength(length.min)
          .setMaxLength(length.max),
      ),
    );
}
