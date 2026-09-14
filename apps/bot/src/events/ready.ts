import { Events, type Client } from "discord.js";

import type { GauliaClient } from "../client/GauliaClient";
import { startHeartbeat } from "../core/heartbeat/heartbeatService";
import { startGuildPresenceResync, syncGuildPresence } from "../core/presence/guildPresenceSync";
import { initEntitlements } from "../modules/premium/services/entitlementService";
import type { GauliaEvent } from "../structures/Event";

const event: GauliaEvent<typeof Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  async execute(client: GauliaClient, readyClient: Client<true>) {
    client.logger.info(
      `Connecté en tant que ${readyClient.user.tag} (shard ${client.shard?.ids.join(",") ?? "0"})`,
    );

    // Une indisponibilité momentanée de Lavalink ou Postgres au démarrage ne doit pas faire
    // planter tout le process de shard : on log et on continue (lavalink-client retente la
    // connexion tout seul ; les commandes touchant la base réessaieront à leur prochain appel).
    try {
      await client.lavalink.init({ id: readyClient.user.id, username: readyClient.user.username });
    } catch (error) {
      client.logger.error({ err: error }, "Échec de l'initialisation de Lavalink au démarrage");
    }

    try {
      await initEntitlements(client);
    } catch (error) {
      client.logger.error({ err: error }, "Échec de la synchronisation premium au démarrage");
    }

    try {
      await syncGuildPresence(client);
    } catch (error) {
      client.logger.error({ err: error }, "Échec de la synchronisation de présence des serveurs");
    }

    startGuildPresenceResync(client);
    startHeartbeat(client);
  },
};

export default event;
