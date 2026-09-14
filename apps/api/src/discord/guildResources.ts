import { env } from "../config/env";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const CACHE_TTL_MS = 30_000;
const CATEGORY_CHANNEL_TYPE = 4;
/** GUILD_TEXT et GUILD_ANNOUNCEMENT : les seuls salons où le bot publie des messages. */
const TEXT_CHANNEL_TYPES = new Set([0, 5]);

export interface GuildChannelOption {
  id: string;
  name: string;
  parentName: string | null;
}

export interface GuildRoleOption {
  id: string;
  name: string;
  color: number;
}

export interface GuildResources {
  channels: GuildChannelOption[];
  roles: GuildRoleOption[];
}

interface RawChannel {
  id: string;
  name: string;
  type: number;
  position: number;
  parent_id: string | null;
}

interface RawRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

const cache = new Map<string, { value: GuildResources; expiresAt: number }>();

async function discordGet<T>(path: string): Promise<T | null> {
  const response = await fetch(`${DISCORD_API_BASE}${path}`, {
    headers: { Authorization: `Bot ${env.DISCORD_TOKEN}` },
  });
  if (response.status === 403 || response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Appel Discord ${path} échoué (${response.status})`);
  }
  return response.json() as Promise<T>;
}

/** Salons texte et rôles d'un serveur, lus avec le token du bot ; null si le bot n'y a pas accès. */
export async function getGuildResources(guildId: string): Promise<GuildResources | null> {
  const cached = cache.get(guildId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const [channels, roles] = await Promise.all([
    discordGet<RawChannel[]>(`/guilds/${guildId}/channels`),
    discordGet<RawRole[]>(`/guilds/${guildId}/roles`),
  ]);
  if (!channels || !roles) return null;

  const categories = new Map(
    channels.filter((channel) => channel.type === CATEGORY_CHANNEL_TYPE).map((c) => [c.id, c]),
  );
  const categoryPosition = (channel: RawChannel): number =>
    channel.parent_id ? (categories.get(channel.parent_id)?.position ?? -1) : -1;

  const value: GuildResources = {
    channels: channels
      .filter((channel) => TEXT_CHANNEL_TYPES.has(channel.type))
      .sort((a, b) => categoryPosition(a) - categoryPosition(b) || a.position - b.position)
      .map((channel) => ({
        id: channel.id,
        name: channel.name,
        parentName: channel.parent_id ? (categories.get(channel.parent_id)?.name ?? null) : null,
      })),
    roles: roles
      .filter((role) => role.id !== guildId && !role.managed)
      .sort((a, b) => b.position - a.position)
      .map((role) => ({ id: role.id, name: role.name, color: role.color })),
  };

  cache.set(guildId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}
