import {
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import { requireZone, zonesForAct, type ZoneDefinition } from "../../data/zones";
import { dispatchGameEvents } from "../events/eventDispatcher";

export interface TravelResult {
  character: AdventureCharacter;
  zone: ZoneDefinition;
  notices: string[];
}

/** Change de région. Une zone ne s'ouvre qu'avec l'acte correspondant : la carte suit l'histoire. */
export async function travelTo(
  character: AdventureCharacter,
  items: AdventureItem[],
  zoneId: string,
): Promise<TravelResult> {
  const zone = requireZone(zoneId);

  if (!zonesForAct(character.actIndex).some((entry) => entry.id === zone.id)) {
    throw new GauliaError(
      `${zone.emoji} ${zone.name} ne s'ouvrira que plus loin dans ton histoire.`,
    );
  }
  if (character.zoneId === zone.id) {
    throw new GauliaError(`Tu es déjà à ${zone.emoji} ${zone.name}.`);
  }

  const moved = await updateAdventureCharacter(character.userId, { zoneId: zone.id });
  const dispatched = await dispatchGameEvents(moved, items, [
    { type: "TRAVEL", zoneId: zone.id, amount: 1 },
  ]);

  return { character: dispatched.character, zone, notices: dispatched.notices };
}
