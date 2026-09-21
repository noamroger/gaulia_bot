export interface ManageableGuild {
  id: string;
  name: string;
  icon: string | null;
}

export interface SessionPayload {
  userId: string;
  username: string;
  avatar: string | null;
  /** Verified Discord address (`email` scope). Null for a session opened before that scope. */
  email: string | null;
  manageableGuilds: ManageableGuild[];
  /** True when userId is in OWNER_IDS: unlocks /admin and bypasses `requireGuildAccess`. */
  isOwner: boolean;
}

export function hasGuildAccess(session: SessionPayload, guildId: string): boolean {
  return session.isOwner || session.manageableGuilds.some((guild) => guild.id === guildId);
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: SessionPayload;
    user: SessionPayload;
  }
}
