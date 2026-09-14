import { getOrCreateGuild } from "@gaulia/database";
import type { FastifyInstance } from "fastify";

import { authenticate } from "../plugins/authenticate";
import { requireGuildAccess } from "../plugins/requireGuildAccess";

export default async function premiumRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { guildId: string } }>(
    "/guilds/:guildId/premium",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request) => {
      const guild = await getOrCreateGuild(request.params.guildId);
      return { premium: guild.premium, premiumExpiresAt: guild.premiumExpiresAt };
    },
  );
}
