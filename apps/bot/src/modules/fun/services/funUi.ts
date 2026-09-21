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
import type { Translator } from "../../../i18n";

export type FunPayload = V2MessagePayload & { allowedMentions: MessageMentionOptions };
export type FunRow = ActionRowBuilder<MessageActionRowComponentBuilder>;
export type Difficulty = "easy" | "normal" | "hard";

export const DIFFICULTIES = ["easy", "normal", "hard"] as const;

export const MODAL_INPUT_ID = "answer";

export function parseDifficulty(value: string | null): Difficulty {
  return value === "easy" || value === "hard" ? value : "normal";
}

/** Difficulty as it reads inside a sentence, not as a choice label. */
export function difficultyLabel(difficulty: Difficulty, t: Translator): string {
  return t(`fun.difficulty.${difficulty}`);
}

/** Text and controls in a single container; only the listed mentions notify. */
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

/** Mention of a player, or the bot name when the seat is taken by the AI. */
export function mention(userId: string | null, t: Translator): string {
  return userId ? `<@${userId}>` : t("fun.bot");
}

/** Splits a customId shaped `fun:<action>:<game>[:<value>]`. */
export function parseCustomId(customId: string): { gameId: string; value: string | undefined } {
  const [, , gameId, value] = customId.split(":");
  if (!gameId) throw new GauliaError("fun.error.staleButton");
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
