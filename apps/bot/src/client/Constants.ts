import { GatewayIntentBits, Partials } from "discord.js";

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

/** Couleurs d'accent utilisées par les containers Components V2. */
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
