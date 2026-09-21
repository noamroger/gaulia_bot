import { Events, type Entitlement } from "discord.js";

import type { GauliaClient } from "../../../client/GauliaClient";
import type { GauliaEvent } from "../../../structures/Event";
import { handleEntitlementCreate } from "../services/entitlementService";

const event: GauliaEvent<typeof Events.EntitlementCreate> = {
  name: Events.EntitlementCreate,
  async execute(client: GauliaClient, entitlement: Entitlement) {
    await handleEntitlementCreate(client, entitlement);
    client.logger.info(
      { entitlementId: entitlement.id, guildId: entitlement.guildId },
      "New premium entitlement",
    );
  },
};

export default event;
