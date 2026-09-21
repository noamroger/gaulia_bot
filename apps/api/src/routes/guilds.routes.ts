import { filterPresentGuildIds } from "@gaulia/database";
import type { FastifyInstance } from "fastify";

import { buildInviteUrl } from "../discord/discordApi";
import { authenticate } from "../plugins/authenticate";

export default async function guildsRoutes(app: FastifyInstance): Promise<void> {
  // Returns EVERY server the user can manage (MANAGE_GUILD on Discord) with a `botPresent` flag:
  // the dashboard shows the ones the bot is already in normally, and the others greyed out but
  // clickable, to open the invite popup through `inviteUrl`.
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
