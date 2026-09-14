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
import type { PermissionLevel } from "../core/permissions/permissionLevel";

export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

/** Aide détaillée affichée par `/help commande:<nom>` ; utilisation et options sont générées depuis `data`. */
export interface CommandHelp {
  details: string;
  /** Exemples d'utilisation, sans le `/` initial. */
  examples?: string[];
}

interface BaseCommand {
  /** Niveau de permission minimum requis. Par défaut : PermissionLevel.Everyone. */
  permissionLevel?: PermissionLevel;
  /** Si vrai, la commande est bloquée avec un upsell si le serveur n'a pas Gaulia Premium. */
  premiumOnly?: boolean;
  /** Cooldown par utilisateur, en secondes. */
  cooldownSeconds?: number;
  /** Utilisable uniquement en serveur (pas en DM). Par défaut : true. */
  guildOnly?: boolean;
  help: CommandHelp;
  /** Nom du dossier `modules/<module>` de la commande, renseigné au chargement. */
  category?: string;
}

export interface ChatInputCommand extends BaseCommand {
  type: "chatInput";
  data: SlashCommandData;
  execute(interaction: ChatInputCommandInteraction, client: GauliaClient): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction, client: GauliaClient): Promise<void>;
}

export interface UserContextMenuCommand extends BaseCommand {
  type: "userContextMenu";
  data: ContextMenuCommandBuilder;
  execute(interaction: UserContextMenuCommandInteraction, client: GauliaClient): Promise<void>;
}

export interface MessageContextMenuCommand extends BaseCommand {
  type: "messageContextMenu";
  data: ContextMenuCommandBuilder;
  execute(interaction: MessageContextMenuCommandInteraction, client: GauliaClient): Promise<void>;
}

export type Command = ChatInputCommand | UserContextMenuCommand | MessageContextMenuCommand;
