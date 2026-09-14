import {
  ApplicationCommandOptionType,
  type APIApplicationCommandBasicOption,
  type APIApplicationCommandOption,
  type ApplicationCommandOptionChoiceData,
  type Collection,
} from "discord.js";

import { Colors } from "../../../client/Constants";
import { PermissionLevel, permissionLevelLabel } from "../../../core/permissions/permissionLevel";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import type {
  ChatInputCommand,
  Command,
  MessageContextMenuCommand,
  UserContextMenuCommand,
} from "../../../structures/Command";
import { MUSIC_COMMAND_ACCESS } from "../../music/services/musicAccess";

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  general: "Général",
  moderation: "Modération",
  automod: "Automod",
  music: "Musique",
  fun: "Fun",
  premium: "Premium",
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

const OPTION_TYPE_LABELS: Readonly<Partial<Record<ApplicationCommandOptionType, string>>> = {
  [ApplicationCommandOptionType.String]: "texte",
  [ApplicationCommandOptionType.Integer]: "nombre entier",
  [ApplicationCommandOptionType.Number]: "nombre",
  [ApplicationCommandOptionType.Boolean]: "oui/non",
  [ApplicationCommandOptionType.User]: "membre",
  [ApplicationCommandOptionType.Channel]: "salon",
  [ApplicationCommandOptionType.Role]: "rôle",
  [ApplicationCommandOptionType.Mentionable]: "membre ou rôle",
  [ApplicationCommandOptionType.Attachment]: "fichier",
};

const MAX_AUTOCOMPLETE_CHOICES = 25;
const MAX_CHOICE_NAME_LENGTH = 100;

interface CommandUsage {
  path: string;
  description: string;
  options: APIApplicationCommandBasicOption[];
}

type ContextMenuCommand = UserContextMenuCommand | MessageContextMenuCommand;

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

function categoryRank(category: string): number {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

function displayName(command: Command): string {
  return command.type === "chatInput" ? `/${command.data.name}` : command.data.name;
}

function byDisplayName(a: Command, b: Command): number {
  return displayName(a).localeCompare(displayName(b), "fr");
}

function contextMenuTarget(command: ContextMenuCommand): string {
  return command.type === "messageContextMenu" ? "un message" : "un membre";
}

function commandSummary(command: Command): string {
  return command.type === "chatInput"
    ? command.data.toJSON().description
    : `Menu contextuel sur ${contextMenuTarget(command)}`;
}

function collectUsages(
  path: string,
  description: string,
  options: readonly APIApplicationCommandOption[],
): CommandUsage[] {
  const usages: CommandUsage[] = [];
  const basicOptions: APIApplicationCommandBasicOption[] = [];

  for (const option of options) {
    if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
      usages.push(
        ...collectUsages(`${path} ${option.name}`, option.description, option.options ?? []),
      );
    } else if (option.type === ApplicationCommandOptionType.Subcommand) {
      usages.push({
        path: `${path} ${option.name}`,
        description: option.description,
        options: option.options ?? [],
      });
    } else {
      basicOptions.push(option);
    }
  }

  return usages.length > 0 ? usages : [{ path, description, options: basicOptions }];
}

function chatInputUsages(command: ChatInputCommand): CommandUsage[] {
  const { name, description, options = [] } = command.data.toJSON();
  return collectUsages(`/${name}`, description, options);
}

function formatSignature(usage: CommandUsage): string {
  const options = usage.options.map((option) =>
    option.required ? ` <${option.name}>` : ` [${option.name}]`,
  );
  return `\`${usage.path}${options.join("")}\``;
}

function formatOption(option: APIApplicationCommandBasicOption): string {
  const type = OPTION_TYPE_LABELS[option.type] ?? "valeur";
  const choices: readonly { name: string }[] = "choices" in option ? (option.choices ?? []) : [];
  const choiceList =
    choices.length > 0 ? ` (choix : ${choices.map((choice) => choice.name).join(", ")})` : "";

  return `- \`${option.name}\` · ${type}${option.required ? ", obligatoire" : ""} — ${option.description}${choiceList}`;
}

function overviewLine(command: Command): string {
  if (command.type !== "chatInput") {
    return `\`${command.data.name}\` — ${commandSummary(command)}`;
  }

  const prefix = `/${command.data.name}`;
  const subcommands = chatInputUsages(command)
    .map((usage) => usage.path.slice(prefix.length).trim())
    .filter(Boolean);

  const signature = subcommands.length > 0 ? `${prefix} ${subcommands.join("|")}` : prefix;
  return `\`${signature}\` — ${commandSummary(command)}`;
}

function usageSection(command: Command): string {
  if (command.type !== "chatInput") {
    return `**Utilisation**\nClic droit sur ${contextMenuTarget(command)} > Applications > ${command.data.name}`;
  }

  const usages = chatInputUsages(command);
  const hasSubcommands = usages.some((usage) => usage.path !== `/${command.data.name}`);

  const lines = usages.flatMap((usage) => [
    hasSubcommands ? `${formatSignature(usage)} — ${usage.description}` : formatSignature(usage),
    ...usage.options.map(formatOption),
  ]);

  return ["**Utilisation**", ...lines].join("\n");
}

function accessSection(command: Command): string {
  const lines = [
    `Niveau requis : ${permissionLevelLabel(command.permissionLevel ?? PermissionLevel.Everyone)}`,
    (command.guildOnly ?? true)
      ? "Utilisable uniquement sur un serveur"
      : "Utilisable aussi en message privé",
  ];

  if (command.premiumOnly) lines.push("Réservée aux serveurs Gaulia Premium");
  if (command.cooldownSeconds) {
    lines.push(`Délai entre deux utilisations : ${command.cooldownSeconds} s`);
  }

  const musicAccess = command.type === "chatInput" && MUSIC_COMMAND_ACCESS[command.data.name];
  if (musicAccess) {
    lines.push(
      musicAccess === "control"
        ? "Limitée au salon musique et au rôle DJ s'ils sont configurés"
        : "Limitée au salon musique s'il est configuré",
    );
  }

  return ["**Accès**", ...lines.map((line) => `- ${line}`)].join("\n");
}

function normalizeQuery(input: string): string {
  return input.trim().replace(/^\//, "").toLowerCase();
}

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}

export function buildHelpOverview(commands: Collection<string, Command>): V2MessagePayload {
  const categories = new Map<string, Command[]>();
  for (const command of commands.values()) {
    const category = command.category ?? "general";
    categories.set(category, [...(categories.get(category) ?? []), command]);
  }

  const sections = [...categories]
    .sort(([a], [b]) => categoryRank(a) - categoryRank(b) || a.localeCompare(b))
    .map(([category, list]) =>
      [`**${categoryLabel(category)}**`, ...list.sort(byDisplayName).map(overviewLine)].join("\n"),
    );

  return toV2Payload(
    true,
    buildContainer(Colors.Primary, [
      "### Aide de Gaulia",
      ...sections,
      "-# `/help commande:<nom>` affiche l'aide détaillée d'une commande.",
    ]),
  );
}

export function buildCommandHelp(command: Command): V2MessagePayload {
  const lines = [
    `### ${displayName(command)}\n${commandSummary(command)}`,
    command.help.details,
    usageSection(command),
  ];

  if (command.help.examples?.length) {
    lines.push(
      ["**Exemples**", ...command.help.examples.map((example) => `\`/${example}\``)].join("\n"),
    );
  }

  lines.push(accessSection(command));

  return toV2Payload(true, buildContainer(Colors.Primary, lines));
}

export function findCommand(
  commands: Collection<string, Command>,
  input: string,
): Command | undefined {
  const query = normalizeQuery(input);
  return commands.find((command) => command.data.name.toLowerCase() === query);
}

export function helpAutocompleteChoices(
  commands: Collection<string, Command>,
  input: string,
): ApplicationCommandOptionChoiceData<string>[] {
  const query = normalizeQuery(input);
  const startsWithQuery = (command: Command) => command.data.name.toLowerCase().startsWith(query);

  return [...commands.values()]
    .filter((command) => command.data.name.toLowerCase().includes(query))
    .sort((a, b) => Number(startsWithQuery(b)) - Number(startsWithQuery(a)) || byDisplayName(a, b))
    .slice(0, MAX_AUTOCOMPLETE_CHOICES)
    .map((command) => ({
      name: truncate(
        `${displayName(command)} — ${commandSummary(command)}`,
        MAX_CHOICE_NAME_LENGTH,
      ),
      value: command.data.name,
    }));
}
