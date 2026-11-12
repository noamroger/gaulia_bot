import { env } from "../config/env";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const CACHE_TTL_MS = 60_000;
const ADMINISTRATOR = 0x8n;
const MANAGE_GUILD = 0x20n;

interface GuildPermissionData {
  ownerId: string;
  /** Permissions of each role, the @everyone role included (its id is the guild id). */
  rolePermissions: Map<string, bigint>;
}

interface Cached<T> {
  value: T;
  expiresAt: number;
}

const guildCache = new Map<string, Cached<GuildPermissionData | null>>();
const accessCache = new Map<string, Cached<boolean | null>>();

function remember<T>(cache: Map<string, Cached<T>>, key: string, value: T): T {
  const now = Date.now();
  for (const [entryKey, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(entryKey);
  }
  cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
  return value;
}

function recall<T>(cache: Map<string, Cached<T>>, key: string): Cached<T> | undefined {
  const entry = cache.get(key);
  return entry && entry.expiresAt > Date.now() ? entry : undefined;
}

async function botGet(path: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${DISCORD_API_BASE}${path}`, {
    headers: { Authorization: `Bot ${env.DISCORD_TOKEN}` },
    signal: AbortSignal.timeout(5_000),
  });
  return { status: response.status, body: response.ok ? await response.json() : null };
}

async function guildPermissionData(guildId: string): Promise<GuildPermissionData | null> {
  const cached = recall(guildCache, guildId);
  if (cached) return cached.value;

  const { status, body } = await botGet(`/guilds/${guildId}`);
  if (status !== 200) return remember(guildCache, guildId, null);

  const guild = body as { owner_id: string; roles: { id: string; permissions: string }[] };
  return remember(guildCache, guildId, {
    ownerId: guild.owner_id,
    rolePermissions: new Map(guild.roles.map((role) => [role.id, BigInt(role.permissions)])),
  });
}

/**
 * Whether the user can manage the server right now, read with the bot token: owner, or
 * Administrator / Manage Server through their roles. Cached one minute.
 *
 * `null` means "cannot tell" (bot not on the server, Discord unreachable): the caller then falls
 * back to the list taken at sign-in, so a Discord incident does not lock everyone out.
 */
export async function liveGuildAccess(guildId: string, userId: string): Promise<boolean | null> {
  const key = `${guildId}:${userId}`;
  const cached = recall(accessCache, key);
  if (cached) return cached.value;

  const guild = await guildPermissionData(guildId);
  if (!guild) return remember(accessCache, key, null);
  if (guild.ownerId === userId) return remember(accessCache, key, true);

  const { status, body } = await botGet(`/guilds/${guildId}/members/${userId}`);
  // The guild answered just above, so a 404 here is "Unknown Member": they left the server.
  if (status === 404) return remember(accessCache, key, false);
  if (status !== 200) return remember(accessCache, key, null);

  const roles = (body as { roles: string[] }).roles;
  let permissions = guild.rolePermissions.get(guildId) ?? 0n;
  for (const roleId of roles) permissions |= guild.rolePermissions.get(roleId) ?? 0n;

  const allowed = (permissions & ADMINISTRATOR) !== 0n || (permissions & MANAGE_GUILD) !== 0n;
  return remember(accessCache, key, allowed);
}
