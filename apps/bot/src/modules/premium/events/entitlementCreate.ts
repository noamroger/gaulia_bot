import { Events, type Entitlement } from "discord.js";

import type { GauliaClient } from "../../../client/GauliaClient";
import type { GauliaEvent } from "../../../structures/Event";
import { handleEntitlementUpsert } from "../services/entitlementService";

const event: GauliaEvent<typeof Events.EntitlementCreate> = {
  name: Events.EntitlementCreate,
  async execute(client: GauliaClient, entitlement: Entitlement) {
    await handleEntitlementUpsert(entitlement);
    client.logger.info(
      { entitlementId: entitlement.id, guildId: entitlement.guildId },
      "Nouvel entitlement premium",
    );
  },
};

export default event;
