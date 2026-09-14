import { Events, type Guild } from "discord.js";

import type { GauliaClient } from "../client/GauliaClient";
import { upsertGuildInfo } from "@gaulia/database";
import type { GauliaEvent } from "../structures/Event";

const event: GauliaEvent<typeof Events.GuildDelete> = {
  name: Events.GuildDelete,
  async execute(client: GauliaClient, guild: Guild) {
    // On conserve la config/historique en base (au cas où le serveur réinvite le bot plus tard),
    // on marque juste le bot comme absent pour que l'API/dashboard ne liste plus ce serveur.
    await upsertGuildInfo(guild.id, { botPresent: false });
    client.logger.info({ guildId: guild.id, guildName: guild.name }, "Bot retiré d'un serveur");
  },
};

export default event;
