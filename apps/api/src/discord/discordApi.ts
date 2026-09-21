import { env } from "../config/env";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const MANAGE_GUILD_FLAG = 0x20n;

// Permissions asked for at invite time: Kick/Ban/Moderate Members, Manage Messages, Manage Roles,
// Manage Guild (native automod rules), View/Send/Embed/Attach/History (text channels),
// Connect/Speak (music). Must cover everything the bot commands need, without Administrator.
const INVITE_PERMISSIONS = 1099783334966n;

const CDN_BASE = "https://cdn.discordapp.com";

/** Member avatar, or the default one Discord derives from the id. */
export function userAvatarUrl(userId: string, avatar: string | null, size = 128): string {
  if (avatar) {
    const extension = avatar.startsWith("a_") ? "gif" : "png";
    return `${CDN_BASE}/avatars/${userId}/${avatar}.${extension}?size=${size}`;
  }
  return `${CDN_BASE}/embed/avatars/${Number((BigInt(userId) >> 22n) % 6n)}.png`;
}

/** Discord invite link prefilled for one server (OAuth2 popup on the dashboard). */
export function buildInviteUrl(guildId: string): string {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    scope: "bot applications.commands",
    permissions: INVITE_PERMISSIONS.toString(),
    guild_id: guildId,
    disable_guild_select: "true",
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  /** Only with the `email` scope, and null when the account has no verified address. */
  email?: string | null;
  verified?: boolean;
}

export interface DiscordUserGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: "code",
    // `email` serves the contact form: no address typed by hand, so no request signed with an
    // address nobody verified.
    scope: "identify guilds email",
    state,
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<DiscordTokenResponse> {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI,
  });

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`OAuth2 code exchange failed (${response.status})`);
  }

  return response.json() as Promise<DiscordTokenResponse>;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Discord user lookup failed (${response.status})`);
  }

  return response.json() as Promise<DiscordUser>;
}

export async function fetchUserGuilds(accessToken: string): Promise<DiscordUserGuild[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Discord guild list lookup failed (${response.status})`);
  }

  return response.json() as Promise<DiscordUserGuild[]>;
}

/** True when the user owns that server or holds MANAGE_GUILD on it. */
export function canManageGuild(guild: DiscordUserGuild): boolean {
  if (guild.owner) return true;
  const permissions = BigInt(guild.permissions);
  return (permissions & MANAGE_GUILD_FLAG) === MANAGE_GUILD_FLAG;
}

export function filterManageableGuilds(guilds: DiscordUserGuild[]): DiscordUserGuild[] {
  return guilds.filter(canManageGuild);
}
