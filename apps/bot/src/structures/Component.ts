import type {
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from "discord.js";

import type { GauliaClient } from "../client/GauliaClient";

interface BaseComponent {
  /**
   * Préfixe du custom_id à matcher (ex: "music:pause"). Le routage se fait par
   * `customId.startsWith(prefix)`, ce qui permet d'encoder des données dynamiques après le préfixe
   * (ex: "music:pause:<guildId>").
   */
  customIdPrefix: string;
}

export interface ButtonComponent extends BaseComponent {
  type: "button";
  execute(interaction: ButtonInteraction, client: GauliaClient): Promise<void>;
}

export interface StringSelectComponent extends BaseComponent {
  type: "stringSelect";
  execute(interaction: StringSelectMenuInteraction, client: GauliaClient): Promise<void>;
}

export interface ModalComponent extends BaseComponent {
  type: "modal";
  execute(interaction: ModalSubmitInteraction, client: GauliaClient): Promise<void>;
}

export type GauliaComponent = ButtonComponent | StringSelectComponent | ModalComponent;
