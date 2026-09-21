import { ButtonBuilder, ButtonStyle } from "discord.js";
import type { AdventureCharacter } from "@gaulia/database";

import { Colors } from "../../../client/Constants";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import { formatDurationMs } from "../../../core/utils/duration";
import type { Translator } from "../../../i18n";
import { itemLabel } from "../data/items";
import { monsterName } from "../data/monsters";
import { ENERGY_MAX } from "../data/pacing";
import { actTitle, requireAct } from "../data/story";
import { zoneDescription, zoneName, type ZoneDefinition } from "../data/zones";
import type { DungeonOutcome, DungeonStatus } from "../services/dungeon/dungeonService";
import type { ExploreOutcome } from "../services/exploration/exploreService";
import { appendRow, exploreButton, navigationRow, viewButton } from "./navigation";
import { formatNumber, gold } from "./format";

function lootLine(loot: { itemId: string; quantity: number }[], t: Translator): string | null {
  if (loot.length === 0) return null;
  return t("adventure.views.explore.loot", {
    list: loot
      .map((entry) =>
        t("adventure.views.explore.lootEntry", {
          quantity: entry.quantity,
          item: itemLabel(t, entry.itemId),
        }),
      )
      .join(" · "),
  });
}

function vitalsLine(character: AdventureCharacter, t: Translator): string {
  return t("adventure.views.explore.vitals", {
    hp: formatNumber(t, character.hp),
    energy: character.energy,
    maxEnergy: ENERGY_MAX,
    gold: formatNumber(t, character.gold),
  });
}

export function exploreView(outcome: ExploreOutcome, t: Translator): V2MessagePayload {
  const { zone, monster, combat } = outcome;
  const lines: string[] = [];

  if (outcome.kind === "COMBAT" && monster && combat) {
    lines.push(
      t(combat.victory ? "adventure.views.explore.victory" : "adventure.views.explore.defeat", {
        emoji: monster.emoji,
        monster: monsterName(t, monster),
      }),
      t("adventure.views.explore.zoneLevel", {
        emoji: zone.emoji,
        zone: zoneName(t, zone),
        level: monster.level,
      }),
      combat.highlights.join("\n"),
    );
  } else if (outcome.kind === "FIND") {
    lines.push(
      t("adventure.views.explore.findTitle"),
      t("adventure.views.explore.zone", { emoji: zone.emoji, zone: zoneName(t, zone) }),
    );
  } else {
    lines.push(
      t("adventure.views.explore.calmTitle"),
      t("adventure.views.explore.zone", { emoji: zone.emoji, zone: zoneName(t, zone) }),
      t("adventure.views.explore.ambiance", { ambiance: outcome.ambiance ?? "" }),
    );
  }

  const gains = [
    outcome.xp > 0 ? t("adventure.views.explore.xp", { xp: formatNumber(t, outcome.xp) }) : null,
    outcome.gold > 0
      ? t("adventure.views.explore.gold", { gold: formatNumber(t, outcome.gold) })
      : null,
    lootLine(outcome.loot, t),
  ].filter(Boolean);
  if (gains.length > 0) lines.push(gains.join(" · "));

  lines.push(vitalsLine(outcome.character, t));
  if (outcome.notices.length > 0) lines.push(outcome.notices.join("\n"));

  const color =
    outcome.kind === "COMBAT" && combat && !combat.victory ? Colors.Warning : Colors.Success;
  const payload = toV2Payload(false, buildContainer(color, lines));
  const userId = outcome.character.userId;

  // The heal button only shows when it is useful: no point offering it without a potion in the bag.
  const actions = [
    exploreButton(t, userId, t("adventure.buttons.exploreAgain")),
    viewButton(t, userId, "bag"),
  ];
  if (outcome.canHeal) {
    actions.push(
      new ButtonBuilder()
        .setCustomId(`adventure:heal:${userId}`)
        .setLabel(t("adventure.buttons.heal"))
        .setEmoji("🧪")
        .setStyle(ButtonStyle.Success),
    );
  }
  appendRow(payload, actions);

  return navigationRow(payload, t, userId, ["map", "quests", "story"]);
}

export function dungeonStatusView(
  character: AdventureCharacter,
  status: DungeonStatus,
  t: Translator,
): V2MessagePayload {
  const lines = [
    t("adventure.views.dungeon.title", { act: actTitle(t, requireAct(status.actIndex)) }),
    t("adventure.views.dungeon.guardian", {
      emoji: status.guardian.emoji,
      name: monsterName(t, status.guardian),
      level: status.guardian.level,
    }),
    status.cooldownMs > 0
      ? t("adventure.views.dungeon.cooldown", {
          duration: formatDurationMs(status.cooldownMs, t),
        })
      : t("adventure.views.dungeon.open"),
    t("adventure.views.dungeon.reward"),
    vitalsLine(character, t),
  ];
  const payload = toV2Payload(false, buildContainer(Colors.Premium, lines));
  if (status.cooldownMs === 0) {
    appendRow(payload, [
      new ButtonBuilder()
        .setCustomId(`adventure:dungeon:${character.userId}`)
        .setLabel(t("adventure.buttons.fightGuardian"))
        .setEmoji("⚔️")
        .setStyle(ButtonStyle.Danger),
    ]);
  }
  return navigationRow(payload, t, character.userId, ["profile", "bag", "story"]);
}

export function dungeonResultView(outcome: DungeonOutcome, t: Translator): V2MessagePayload {
  const lines = [
    t(outcome.combat.victory ? "adventure.views.dungeon.won" : "adventure.views.dungeon.held", {
      emoji: outcome.guardian.emoji,
    }),
    t("adventure.views.dungeon.guardianLine", {
      name: monsterName(t, outcome.guardian),
      level: outcome.guardian.level,
    }),
    outcome.combat.highlights.join("\n"),
  ];

  if (outcome.combat.victory) {
    const gains = [
      t("adventure.views.explore.xp", { xp: formatNumber(t, outcome.xp) }),
      t("adventure.views.explore.gold", { gold: formatNumber(t, outcome.gold) }),
      lootLine(outcome.loot, t),
    ].filter(Boolean);
    lines.push(gains.join(" · "));
  }

  lines.push(vitalsLine(outcome.character, t));
  if (outcome.notices.length > 0) lines.push(outcome.notices.join("\n"));

  const payload = toV2Payload(
    false,
    buildContainer(outcome.combat.victory ? Colors.Success : Colors.Danger, lines),
  );
  return navigationRow(payload, t, outcome.character.userId, ["profile", "bag", "story", "quests"]);
}

export function travelView(
  character: AdventureCharacter,
  zone: ZoneDefinition,
  notices: string[],
  t: Translator,
): V2MessagePayload {
  const payload = toV2Payload(
    false,
    buildContainer(Colors.Success, [
      t("adventure.views.travel.title", { emoji: zone.emoji, zone: zoneName(t, zone) }),
      t("adventure.views.travel.description", { description: zoneDescription(t, zone) }),
      t("adventure.views.travel.vitals", {
        vitals: vitalsLine(character, t),
        gold: gold(t, character.gold),
      }),
      ...(notices.length > 0 ? [notices.join("\n")] : []),
    ]),
  );
  appendRow(payload, [exploreButton(t, character.userId), viewButton(t, character.userId, "map")]);
  return payload;
}
