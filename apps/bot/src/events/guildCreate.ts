import { upsertGuildInfo } from "@gaulia/database";
import { Events, type Guild } from "discord.js";

import type { GauliaClient } from "../client/GauliaClient";
import { guildInfo } from "../core/presence/guildPresenceSync";
import type { GauliaEvent } from "../structures/Event";

const event: GauliaEvent<typeof Events.GuildCreate> = {
  name: Events.GuildCreate,
  async execute(client: GauliaClient, guild: Guild) {
    await upsertGuildInfo(guild.id, { ...guildInfo(guild), botPresent: true });
    client.logger.info(
      { guildId: guild.id, guildName: guild.name },
      "Bot ajouté à un nouveau serveur",
    );
  },
};

export default event;
