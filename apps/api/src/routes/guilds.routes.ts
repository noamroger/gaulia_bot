import { filterPresentGuildIds } from "@gaulia/database";
import type { FastifyInstance } from "fastify";

import { buildInviteUrl } from "../discord/discordApi";
import { authenticate } from "../plugins/authenticate";

export default async function guildsRoutes(app: FastifyInstance): Promise<void> {
  // Renvoie TOUS les serveurs où l'utilisateur peut gérer (permission MANAGE_GUILD côté Discord),
  // avec un flag `botPresent` : le dashboard affiche normalement ceux où le bot est déjà là, et en
  // grisé (cliquables pour ouvrir le popup d'invitation via `inviteUrl`) les autres.
  app.get("/guilds", { preHandler: authenticate }, async (request) => {
    const presentIds = new Set(
      await filterPresentGuildIds(request.user.manageableGuilds.map((guild) => guild.id)),
    );

    return request.user.manageableGuilds.map((guild) => {
      const botPresent = presentIds.has(guild.id);
      return {
        ...guild,
        botPresent,
        inviteUrl: botPresent ? null : buildInviteUrl(guild.id),
      };
    });
  });
}
