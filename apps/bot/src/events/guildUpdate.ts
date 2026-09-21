import { upsertGuildInfo } from "@gaulia/database";
import { Events, type Guild } from "discord.js";

import type { GauliaClient } from "../client/GauliaClient";
import { guildInfo } from "../core/presence/guildPresenceSync";
import type { GauliaEvent } from "../structures/Event";

/** Keeps the server name and icon current in the database, for the admin panel. */
const event: GauliaEvent<typeof Events.GuildUpdate> = {
  name: Events.GuildUpdate,
  async execute(_client: GauliaClient, oldGuild: Guild, newGuild: Guild) {
    if (oldGuild.name === newGuild.name && oldGuild.icon === newGuild.icon) return;
    await upsertGuildInfo(newGuild.id, guildInfo(newGuild));
  },
};

export default event;
