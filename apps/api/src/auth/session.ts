export interface ManageableGuild {
  id: string;
  name: string;
  icon: string | null;
}

export interface SessionPayload {
  userId: string;
  username: string;
  avatar: string | null;
  manageableGuilds: ManageableGuild[];
  /** Vrai si userId figure dans OWNER_IDS — donne accès au panel admin (/admin) et bypass
   *  `requireGuildAccess` (un propriétaire du bot peut gérer n'importe quel serveur). */
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
