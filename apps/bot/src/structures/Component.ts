import type {
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from "discord.js";

import type { GauliaClient } from "../client/GauliaClient";
import type { Translator } from "../i18n";

interface BaseComponent {
  /**
   * custom_id prefix to match (e.g. "music:pause"). Routing uses `customId.startsWith(prefix)`,
   * which lets dynamic data follow the prefix (e.g. "music:pause:<guildId>").
   */
  customIdPrefix: string;
}

export interface ButtonComponent extends BaseComponent {
  type: "button";
  execute(interaction: ButtonInteraction, client: GauliaClient, t: Translator): Promise<void>;
}

export interface StringSelectComponent extends BaseComponent {
  type: "stringSelect";
  execute(
    interaction: StringSelectMenuInteraction,
    client: GauliaClient,
    t: Translator,
  ): Promise<void>;
}

export interface ModalComponent extends BaseComponent {
  type: "modal";
  execute(interaction: ModalSubmitInteraction, client: GauliaClient, t: Translator): Promise<void>;
}

export type GauliaComponent = ButtonComponent | StringSelectComponent | ModalComponent;
