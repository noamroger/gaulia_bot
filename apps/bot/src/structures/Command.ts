import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  UserContextMenuCommandInteraction,
} from "discord.js";

import type { GauliaClient } from "../client/GauliaClient";
import type { Translator } from "../i18n";
import type { PermissionLevel } from "../core/permissions/permissionLevel";

export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

interface BaseCommand {
  /**
   * Catalog entry of the command, `<module>.commands.<command>`. It holds the name and description
   * pushed to Discord as native localizations, plus the `help.details` and `help.examples` keys
   * `/help` reads.
   */
  i18nKey: string;
  /** Minimum permission level required. Defaults to PermissionLevel.Everyone. */
  permissionLevel?: PermissionLevel;
  /** When true, the command is blocked with an upsell unless the server has Gaulia Premium. */
  premiumOnly?: boolean;
  /** Per-user cooldown, in seconds. */
  cooldownSeconds?: number;
  /** Server only, no DM. Defaults to true. */
  guildOnly?: boolean;
  /** Name of the command's `modules/<module>` folder, filled in at load time. */
  category?: string;
}

export interface ChatInputCommand extends BaseCommand {
  type: "chatInput";
  data: SlashCommandData;
  execute(
    interaction: ChatInputCommandInteraction,
    client: GauliaClient,
    t: Translator,
  ): Promise<void>;
  autocomplete?(
    interaction: AutocompleteInteraction,
    client: GauliaClient,
    t: Translator,
  ): Promise<void>;
}

export interface UserContextMenuCommand extends BaseCommand {
  type: "userContextMenu";
  data: ContextMenuCommandBuilder;
  execute(
    interaction: UserContextMenuCommandInteraction,
    client: GauliaClient,
    t: Translator,
  ): Promise<void>;
}

export interface MessageContextMenuCommand extends BaseCommand {
  type: "messageContextMenu";
  data: ContextMenuCommandBuilder;
  execute(
    interaction: MessageContextMenuCommandInteraction,
    client: GauliaClient,
    t: Translator,
  ): Promise<void>;
}

export type Command = ChatInputCommand | UserContextMenuCommand | MessageContextMenuCommand;
