import {
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import type { Translator } from "../../../../i18n";
import { requireZone, zoneName, zonesForAct, type ZoneDefinition } from "../../data/zones";
import { dispatchGameEvents } from "../events/eventDispatcher";

export interface TravelResult {
  character: AdventureCharacter;
  zone: ZoneDefinition;
  notices: string[];
}

/** Moves to another region. A zone only opens with its act, so the map follows the story. */
export async function travelTo(
  character: AdventureCharacter,
  items: AdventureItem[],
  zoneId: string,
  t: Translator,
): Promise<TravelResult> {
  const zone = requireZone(zoneId);
  const label = `${zone.emoji} ${zoneName(t, zone)}`;

  if (!zonesForAct(character.actIndex).some((entry) => entry.id === zone.id)) {
    throw new GauliaError("adventure.error.zoneLocked", { zone: label });
  }
  if (character.zoneId === zone.id) {
    throw new GauliaError("adventure.error.alreadyThere", { zone: label });
  }

  const moved = await updateAdventureCharacter(character.userId, { zoneId: zone.id });
  const dispatched = await dispatchGameEvents(
    moved,
    items,
    [{ type: "TRAVEL", zoneId: zone.id, amount: 1 }],
    t,
  );

  return { character: dispatched.character, zone, notices: dispatched.notices };
}
