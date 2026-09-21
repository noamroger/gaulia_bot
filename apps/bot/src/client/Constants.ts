import { GatewayIntentBits, Partials, PermissionFlagsBits, PermissionsBitField } from "discord.js";

export const GAULIA_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildModeration,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.GuildExpressions,
];

export const GAULIA_PARTIALS = [Partials.Message, Partials.Channel, Partials.GuildMember];

/** Permissions requested by the invite link: the strict minimum each module needs. */
const INVITE_PERMISSIONS = new PermissionsBitField([
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.SendMessagesInThreads,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.UseExternalEmojis,
  // Moderation: purge, kick, ban, timeout, and native automod, which requires Manage Server.
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.ManageGuild,
  // Music.
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.Speak,
]);

/**
 * Bot install link. Both scopes are required: without `applications.commands` Discord refuses the
 * authorization ("no scope were provided") and the slash commands are never installed.
 */
export function botInviteUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: "bot applications.commands",
    permissions: INVITE_PERMISSIONS.bitfield.toString(),
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

/** Website of the bot's author, shown in `/botinfo`. */
export const OWNER_WEBSITE_URL = "https://noamroger.fr";

/** Accent colours used by the Components V2 containers. */
export const Colors = {
  Primary: 0x5865f2,
  Success: 0x57f287,
  Danger: 0xed4245,
  Warning: 0xfee75c,
  Premium: 0xeb459e,
  Neutral: 0x2b2d31,
  Music: 0xffffff,
} as const;

export const Emojis = {
  Success: "✅",
  Error: "❌",
  Warning: "⚠️",
  Info: "ℹ️",
  Premium: "✨",
  Music: "🎵",
  Automod: "🛡️",
  Moderation: "🔨",
  Loading: "⏳",
  Loop: "<:loop:1463551308320604361>",
  Shuffle: "<:shuffle:1463551288439607379>",
  Pause: "⏸️",
  Resume: "▶️",
  Skip: "⏩",
  Back: "↩️",
  Stop: "⛔",
  VolumeDown: "🔉",
  VolumeUp: "🔊",
  Filters: "🎚️",
} as const;

export const InviteRegex =
  /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li|com)|discordapp\.com\/invite)\/[a-zA-Z0-9-]+/gi;

export const FREE_QUEUE_LIMIT = 100;
export const PREMIUM_QUEUE_LIMIT = 1000;
