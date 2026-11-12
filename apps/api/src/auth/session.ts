import { getDashboardSessionGuilds } from "@gaulia/database";

import { env } from "../config/env";

export interface ManageableGuild {
  id: string;
  name: string;
  icon: string | null;
}

/** What the signed cookie carries. The server list lives in `dashboard_sessions`, keyed by `sid`. */
export interface TokenPayload {
  sid?: string;
  userId: string;
  username: string;
  avatar: string | null;
  /** Verified Discord address (`email` scope). Null for a session opened before that scope. */
  email: string | null;
  /**
   * Only in cookies signed before sessions moved server side: they still hold the list. Such a
   * cookie expires within 12 hours of the deploy, after which this field can go.
   */
  manageableGuilds?: ManageableGuild[];
}

export interface SessionPayload {
  userId: string;
  username: string;
  avatar: string | null;
  email: string | null;
  manageableGuilds: ManageableGuild[];
  /** True when userId is in OWNER_IDS: unlocks /admin and bypasses `requireGuildAccess`. */
  isOwner: boolean;
}

/** The full session behind a verified cookie, or null when it was closed, erased or expired. */
export async function resolveSession(token: TokenPayload): Promise<SessionPayload | null> {
  const manageableGuilds = token.sid
    ? await getDashboardSessionGuilds(token.sid, token.userId)
    : (token.manageableGuilds ?? null);
  if (!manageableGuilds) return null;

  return {
    userId: token.userId,
    username: token.username,
    avatar: token.avatar,
    email: token.email ?? null,
    manageableGuilds,
    // Read at each request rather than frozen in the cookie: removing an owner takes effect now.
    isOwner: env.OWNER_IDS.includes(token.userId),
  };
}

export function hasGuildAccess(session: SessionPayload, guildId: string): boolean {
  return session.isOwner || session.manageableGuilds.some((guild) => guild.id === guildId);
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: TokenPayload;
    user: SessionPayload;
  }
}
