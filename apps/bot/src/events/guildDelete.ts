import { Events, type Guild } from "discord.js";

import type { GauliaClient } from "../client/GauliaClient";
import { upsertGuildInfo } from "@gaulia/database";
import type { GauliaEvent } from "../structures/Event";

const event: GauliaEvent<typeof Events.GuildDelete> = {
  name: Events.GuildDelete,
  async execute(client: GauliaClient, guild: Guild) {
    // The config and history stay in the database, in case the server invites the bot back; only
    // the presence flag drops, so the API and dashboard stop listing this server.
    await upsertGuildInfo(guild.id, { botPresent: false });
    client.logger.info({ guildId: guild.id, guildName: guild.name }, "Bot removed from a server");
  },
};

export default event;
