import { Events, type Entitlement } from "discord.js";

import type { GauliaClient } from "../../../client/GauliaClient";
import type { GauliaEvent } from "../../../structures/Event";
import { handleEntitlementUpsert } from "../services/entitlementService";

const event: GauliaEvent<typeof Events.EntitlementUpdate> = {
  name: Events.EntitlementUpdate,
  async execute(
    client: GauliaClient,
    _oldEntitlement: Entitlement | null,
    newEntitlement: Entitlement,
  ) {
    await handleEntitlementUpsert(newEntitlement);
    client.logger.info(
      { entitlementId: newEntitlement.id, guildId: newEntitlement.guildId },
      "Premium entitlement updated",
    );
  },
};

export default event;
