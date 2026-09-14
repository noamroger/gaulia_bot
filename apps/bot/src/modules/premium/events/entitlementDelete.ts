import { Events, type Entitlement } from "discord.js";

import type { GauliaClient } from "../../../client/GauliaClient";
import type { GauliaEvent } from "../../../structures/Event";
import { handleEntitlementDelete } from "../services/entitlementService";

const event: GauliaEvent<typeof Events.EntitlementDelete> = {
  name: Events.EntitlementDelete,
  async execute(client: GauliaClient, entitlement: Entitlement) {
    await handleEntitlementDelete(entitlement);
    client.logger.info(
      { entitlementId: entitlement.id, guildId: entitlement.guildId },
      "Entitlement premium supprimé",
    );
  },
};

export default event;
