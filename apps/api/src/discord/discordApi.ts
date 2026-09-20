import { env } from "../config/env";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const MANAGE_GUILD_FLAG = 0x20n;

// Permissions demandées à l'invitation : Kick/Ban/Moderate Members, Manage Messages, Manage Roles,
// Manage Guild (règles d'automod natif), View/Send/Embed/Attach/History (channels texte),
// Connect/Speak (musique). Doit couvrir tout ce que les commandes du bot exigent (voir
// core/permissions et les commandes de modération) sans aller jusqu'à Administrator.
const INVITE_PERMISSIONS = 1099783334966n;

const CDN_BASE = "https://cdn.discordapp.com";

/** Avatar d'un membre, ou l'avatar par défaut que Discord dérive de l'identifiant. */
export function userAvatarUrl(userId: string, avatar: string | null, size = 128): string {
  if (avatar) {
    const extension = avatar.startsWith("a_") ? "gif" : "png";
    return `${CDN_BASE}/avatars/${userId}/${avatar}.${extension}?size=${size}`;
  }
  return `${CDN_BASE}/embed/avatars/${Number((BigInt(userId) >> 22n) % 6n)}.png`;
}

/** Lien d'invitation Discord pré-rempli pour un serveur précis (popup OAuth2 côté dashboard). */
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
  /** Présent uniquement avec le scope `email`, et nul si le compte n'en a pas de vérifié. */
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
    // `email` sert au formulaire de contact : il évite de faire saisir une adresse à la main, donc
    // de recevoir des demandes signées d'une adresse que personne n'a vérifiée.
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
    throw new Error(`Échange du code OAuth2 échoué (${response.status})`);
  }

  return response.json() as Promise<DiscordTokenResponse>;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Récupération de l'utilisateur Discord échouée (${response.status})`);
  }

  return response.json() as Promise<DiscordUser>;
}

export async function fetchUserGuilds(accessToken: string): Promise<DiscordUserGuild[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Récupération des serveurs Discord échouée (${response.status})`);
  }

  return response.json() as Promise<DiscordUserGuild[]>;
}

/** Vrai si l'utilisateur est owner ou a la permission MANAGE_GUILD sur ce serveur. */
export function canManageGuild(guild: DiscordUserGuild): boolean {
  if (guild.owner) return true;
  const permissions = BigInt(guild.permissions);
  return (permissions & MANAGE_GUILD_FLAG) === MANAGE_GUILD_FLAG;
}

export function filterManageableGuilds(guilds: DiscordUserGuild[]): DiscordUserGuild[] {
  return guilds.filter(canManageGuild);
}
