import {
  ApplicationCommandOptionType,
  type APIApplicationCommandBasicOption,
  type APIApplicationCommandOption,
  type ApplicationCommandOptionChoiceData,
  type Collection,
  type Locale,
} from "discord.js";

import { Colors } from "../../../client/Constants";
import { PermissionLevel, permissionLevelLabel } from "../../../core/permissions/permissionLevel";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import { DISCORD_LOCALES, type AppLocale, type Translator } from "../../../i18n";
import type {
  ChatInputCommand,
  Command,
  MessageContextMenuCommand,
  UserContextMenuCommand,
} from "../../../structures/Command";
import { MUSIC_COMMAND_ACCESS } from "../../music/services/musicAccess";

const CATEGORY_ORDER = [
  "general",
  "moderation",
  "automod",
  "music",
  "fun",
  "adventure",
  "premium",
  "settings",
];

const OPTION_TYPE_KEYS: Readonly<Partial<Record<ApplicationCommandOptionType, string>>> = {
  [ApplicationCommandOptionType.String]: "string",
  [ApplicationCommandOptionType.Integer]: "integer",
  [ApplicationCommandOptionType.Number]: "number",
  [ApplicationCommandOptionType.Boolean]: "boolean",
  [ApplicationCommandOptionType.User]: "user",
  [ApplicationCommandOptionType.Channel]: "channel",
  [ApplicationCommandOptionType.Role]: "role",
  [ApplicationCommandOptionType.Mentionable]: "mentionable",
  [ApplicationCommandOptionType.Attachment]: "attachment",
};

const MAX_AUTOCOMPLETE_CHOICES = 25;
const MAX_CHOICE_NAME_LENGTH = 100;

interface CommandUsage {
  path: string;
  description: string;
  options: APIApplicationCommandBasicOption[];
}

/** Anything carrying the localization maps Discord stores next to a name or a description. */
interface Localizable {
  name: string;
  name_localizations?: Partial<Record<Locale, string | null>> | null;
  description?: string;
  description_localizations?: Partial<Record<Locale, string | null>> | null;
}

type ContextMenuCommand = UserContextMenuCommand | MessageContextMenuCommand;

/**
 * Subcommands and options are already localized inside the command payload, so the help reads them
 * back from there instead of holding a second copy of every key.
 */
function discordLocaleOf(locale: AppLocale): Locale {
  return DISCORD_LOCALES[locale][0]!;
}

function localizedName(entry: Localizable, locale: AppLocale): string {
  return entry.name_localizations?.[discordLocaleOf(locale)] ?? entry.name;
}

function localizedDescription(entry: Localizable, locale: AppLocale): string {
  return entry.description_localizations?.[discordLocaleOf(locale)] ?? entry.description ?? "";
}

function categoryLabel(category: string, t: Translator): string {
  const key = `general.help.categories.${category}`;
  const label = t(key);
  return label === key ? category.charAt(0).toUpperCase() + category.slice(1) : label;
}

function categoryRank(category: string): number {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

function commandName(command: Command, t: Translator): string {
  return t(`${command.i18nKey}.name`);
}

function displayName(command: Command, t: Translator): string {
  const name = commandName(command, t);
  return command.type === "chatInput" ? `/${name.toLowerCase()}` : name;
}

function byDisplayName(a: Command, b: Command, t: Translator): number {
  return displayName(a, t).localeCompare(displayName(b, t), t.locale);
}

function contextMenuTarget(command: ContextMenuCommand, t: Translator): string {
  return command.type === "messageContextMenu"
    ? t("general.help.contextMenu.onMessage")
    : t("general.help.contextMenu.onUser");
}

function commandSummary(command: Command, t: Translator): string {
  return command.type === "chatInput"
    ? t(`${command.i18nKey}.description`)
    : t("general.help.contextMenu.summary", { target: contextMenuTarget(command, t) });
}

function collectUsages(
  path: string,
  description: string,
  options: readonly APIApplicationCommandOption[],
  locale: AppLocale,
): CommandUsage[] {
  const usages: CommandUsage[] = [];
  const basicOptions: APIApplicationCommandBasicOption[] = [];

  for (const option of options) {
    if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
      usages.push(
        ...collectUsages(
          `${path} ${localizedName(option, locale)}`,
          localizedDescription(option, locale),
          option.options ?? [],
          locale,
        ),
      );
    } else if (option.type === ApplicationCommandOptionType.Subcommand) {
      usages.push({
        path: `${path} ${localizedName(option, locale)}`,
        description: localizedDescription(option, locale),
        options: option.options ?? [],
      });
    } else {
      basicOptions.push(option);
    }
  }

  return usages.length > 0 ? usages : [{ path, description, options: basicOptions }];
}

function chatInputUsages(command: ChatInputCommand, locale: AppLocale): CommandUsage[] {
  const payload = command.data.toJSON();
  return collectUsages(
    `/${localizedName(payload, locale)}`,
    localizedDescription(payload, locale),
    payload.options ?? [],
    locale,
  );
}

function formatSignature(usage: CommandUsage, locale: AppLocale): string {
  const options = usage.options.map((option) => {
    const name = localizedName(option, locale);
    return option.required ? ` <${name}>` : ` [${name}]`;
  });
  return `\`${usage.path}${options.join("")}\``;
}

function formatOption(option: APIApplicationCommandBasicOption, t: Translator): string {
  const locale = t.locale;
  const typeKey = OPTION_TYPE_KEYS[option.type] ?? "fallback";
  const type = t(`general.help.optionTypes.${typeKey}`);
  const required = option.required ? t("general.help.required") : "";

  const choices: readonly Localizable[] = "choices" in option ? (option.choices ?? []) : [];
  const choiceList =
    choices.length > 0
      ? t("general.help.choices", {
          list: choices.map((choice) => localizedName(choice, locale)).join(", "),
        })
      : "";

  return `- \`${localizedName(option, locale)}\` · ${type}${required} - ${localizedDescription(option, locale)}${choiceList}`;
}

function overviewLine(command: Command, t: Translator): string {
  if (command.type !== "chatInput") {
    return `\`${commandName(command, t)}\` - ${commandSummary(command, t)}`;
  }

  const prefix = displayName(command, t);
  const subcommands = chatInputUsages(command, t.locale)
    .map((usage) => usage.path.slice(prefix.length).trim())
    .filter(Boolean);

  const signature = subcommands.length > 0 ? `${prefix} ${subcommands.join("|")}` : prefix;
  return `\`${signature}\` - ${commandSummary(command, t)}`;
}

function usageSection(command: Command, t: Translator): string {
  if (command.type !== "chatInput") {
    return [
      `**${t("general.help.usage")}**`,
      t("general.help.contextMenu.usage", {
        target: contextMenuTarget(command, t),
        name: commandName(command, t),
      }),
    ].join("\n");
  }

  const usages = chatInputUsages(command, t.locale);
  const hasSubcommands = usages.some((usage) => usage.path !== displayName(command, t));

  const lines = usages.flatMap((usage) => [
    hasSubcommands
      ? `${formatSignature(usage, t.locale)} - ${usage.description}`
      : formatSignature(usage, t.locale),
    ...usage.options.map((option) => formatOption(option, t)),
  ]);

  return [`**${t("general.help.usage")}**`, ...lines].join("\n");
}

function accessSection(command: Command, t: Translator): string {
  const lines = [
    t("general.help.accessLevel", {
      level: permissionLevelLabel(command.permissionLevel ?? PermissionLevel.Everyone, t),
    }),
    (command.guildOnly ?? true) ? t("general.help.guildOnly") : t("general.help.alsoInDm"),
  ];

  if (command.premiumOnly) lines.push(t("general.help.premiumOnly"));
  if (command.cooldownSeconds) {
    lines.push(t("general.help.cooldown", { seconds: command.cooldownSeconds }));
  }

  const musicAccess = command.type === "chatInput" && MUSIC_COMMAND_ACCESS[command.data.name];
  if (musicAccess) {
    lines.push(
      musicAccess === "control" ? t("general.help.musicControl") : t("general.help.musicListen"),
    );
  }

  return [`**${t("general.help.access")}**`, ...lines.map((line) => `- ${line}`)].join("\n");
}

function normalizeQuery(input: string): string {
  return input.trim().replace(/^\//, "").toLowerCase();
}

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}

export function buildHelpOverview(
  commands: Collection<string, Command>,
  t: Translator,
): V2MessagePayload {
  const categories = new Map<string, Command[]>();
  for (const command of commands.values()) {
    const category = command.category ?? "general";
    categories.set(category, [...(categories.get(category) ?? []), command]);
  }

  const sections = [...categories]
    .sort(([a], [b]) => categoryRank(a) - categoryRank(b) || a.localeCompare(b))
    .map(([category, list]) =>
      [
        `**${categoryLabel(category, t)}**`,
        ...list.sort((a, b) => byDisplayName(a, b, t)).map((command) => overviewLine(command, t)),
      ].join("\n"),
    );

  return toV2Payload(
    true,
    buildContainer(Colors.Primary, [
      `### ${t("general.help.title")}`,
      ...sections,
      `-# ${t("general.help.footer")}`,
    ]),
  );
}

export function buildCommandHelp(command: Command, t: Translator): V2MessagePayload {
  const lines = [
    `### ${displayName(command, t)}\n${commandSummary(command, t)}`,
    t(`${command.i18nKey}.help.details`),
    usageSection(command, t),
  ];

  const examples = t.list(`${command.i18nKey}.help.examples`);
  if (examples.length > 0) {
    lines.push(
      [`**${t("general.help.examples")}**`, ...examples.map((example) => `\`/${example}\``)].join(
        "\n",
      ),
    );
  }

  lines.push(accessSection(command, t));

  return toV2Payload(true, buildContainer(Colors.Primary, lines));
}

/** Matches on the canonical name as well as the reader's own, so both spellings find a command. */
export function findCommand(
  commands: Collection<string, Command>,
  input: string,
  t: Translator,
): Command | undefined {
  const query = normalizeQuery(input);
  return commands.find(
    (command) =>
      command.data.name.toLowerCase() === query || commandName(command, t).toLowerCase() === query,
  );
}

export function helpAutocompleteChoices(
  commands: Collection<string, Command>,
  input: string,
  t: Translator,
): ApplicationCommandOptionChoiceData<string>[] {
  const query = normalizeQuery(input);
  const searchable = (command: Command) =>
    `${command.data.name} ${commandName(command, t)}`.toLowerCase();

  return [...commands.values()]
    .filter((command) => searchable(command).includes(query))
    .sort(
      (a, b) =>
        Number(commandName(b, t).toLowerCase().startsWith(query)) -
          Number(commandName(a, t).toLowerCase().startsWith(query)) || byDisplayName(a, b, t),
    )
    .slice(0, MAX_AUTOCOMPLETE_CHOICES)
    .map((command) => ({
      name: truncate(
        `${displayName(command, t)} - ${commandSummary(command, t)}`,
        MAX_CHOICE_NAME_LENGTH,
      ),
      // The value goes back to Discord, so it stays the canonical name.
      value: command.data.name,
    }));
}
