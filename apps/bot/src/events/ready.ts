import { Events, type Client } from "discord.js";

import type { GauliaClient } from "../client/GauliaClient";
import { startHeartbeat } from "../core/heartbeat/heartbeatService";
import { startGuildPresenceResync, syncGuildPresence } from "../core/presence/guildPresenceSync";
import {
  initEntitlements,
  startPremiumGrantSync,
} from "../modules/premium/services/entitlementService";
import type { GauliaEvent } from "../structures/Event";

const event: GauliaEvent<typeof Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  async execute(client: GauliaClient, readyClient: Client<true>) {
    client.logger.info(
      `Logged in as ${readyClient.user.tag} (shard ${client.shard?.ids.join(",") ?? "0"})`,
    );

    // A brief Lavalink or Postgres outage at startup must not bring the shard process down: log
    // and carry on. lavalink-client retries on its own, and database commands retry on their next
    // call.
    try {
      await client.lavalink.init({ id: readyClient.user.id, username: readyClient.user.username });
    } catch (error) {
      client.logger.error({ err: error }, "Could not initialise Lavalink at startup");
    }

    try {
      await initEntitlements(client);
    } catch (error) {
      client.logger.error({ err: error }, "Could not sync premium at startup");
    }

    try {
      await syncGuildPresence(client);
    } catch (error) {
      client.logger.error({ err: error }, "Could not sync the server presence");
    }

    startGuildPresenceResync(client);
    startPremiumGrantSync(client);
    startHeartbeat(client);
  },
};

export default event;
