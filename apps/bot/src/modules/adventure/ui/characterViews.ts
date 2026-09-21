import { ButtonBuilder, ButtonStyle } from "discord.js";
import type { AdventureCharacter, AdventureItem } from "@gaulia/database";

import { Colors } from "../../../client/Constants";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";
import { className, classDefinition } from "../data/classes";
import { itemLabel, slotLabel, type ItemSlot } from "../data/items";
import { ENERGY_MAX, xpToNextLevel } from "../data/pacing";
import { chapterTitle, TOTAL_CHAPTERS } from "../data/story";
import { requireZone, zoneDescription, zoneName, type ZoneDefinition } from "../data/zones";
import { computeStats, equippedIn } from "../services/character/statsService";
import { xpRatio } from "../services/character/progressionService";
import type { ChapterStatus } from "../services/progress/storyService";
import { checkbox, counter, formatNumber, progressBar } from "./format";
import { appendRow, exploreButton, navigationRow, viewButton } from "./navigation";

const SLOTS: ItemSlot[] = ["arme", "armure", "talisman"];

export function profileView(
  character: AdventureCharacter,
  items: AdventureItem[],
  t: Translator,
  options: { title: string | null; rank: number; chapter: ChapterStatus | null },
): V2MessagePayload {
  const stats = computeStats(character, items);
  const definition = classDefinition(character.characterClass);
  const zone = requireZone(character.zoneId);
  const needed = xpToNextLevel(character.level);
  const name = character.username ?? t("adventure.views.unnamed");

  const equipment = SLOTS.map((slot) => {
    const row = equippedIn(items, slot);
    return t("adventure.views.profile.gearLine", {
      slot: slotLabel(t, slot),
      item: row ? itemLabel(t, row.itemId) : t("adventure.views.profile.emptySlot"),
    });
  });

  const lines = [
    options.title
      ? t("adventure.views.profile.headingTitled", {
          emoji: definition.emoji,
          name,
          title: options.title,
        })
      : t("adventure.views.profile.heading", { emoji: definition.emoji, name }),
    t("adventure.views.profile.subtitle", {
      class: className(t, character.characterClass),
      level: character.level,
      zoneEmoji: zone.emoji,
      zone: zoneName(t, zone),
      rank: formatNumber(t, options.rank),
    }),
    [
      t("adventure.views.profile.vitals", {
        hp: formatNumber(t, character.hp),
        maxHp: formatNumber(t, stats.maxHp),
        energy: character.energy,
        maxEnergy: ENERGY_MAX,
      }),
      t("adventure.views.profile.purse", {
        gold: formatNumber(t, character.gold),
        echoes: formatNumber(t, character.echoes),
      }),
    ].join("\n"),
    t("adventure.views.profile.experience", {
      bar: progressBar(xpRatio(character)),
      value:
        needed === 0 ? t("adventure.views.profile.maxLevel") : counter(t, character.xp, needed),
    }),
    [
      t("adventure.views.profile.offense", {
        attack: formatNumber(t, stats.attack),
        power: formatNumber(t, stats.power),
        defense: formatNumber(t, stats.defense),
      }),
      t("adventure.views.profile.rates", { crit: stats.crit, dodge: stats.dodge }),
      `${t("adventure.views.profile.stats", {
        might: character.might,
        agility: character.agility,
        spirit: character.spirit,
      })}${
        character.statPoints > 0
          ? t("adventure.views.profile.pendingPoints", { count: character.statPoints })
          : ""
      }`,
    ].join("\n"),
    `${t("adventure.views.profile.gear")}\n${equipment.join("\n")}`,
    options.chapter
      ? [
          t("adventure.views.profile.story", {
            emoji: options.chapter.actEmoji,
            act: options.chapter.actTitle,
          }),
          t("adventure.views.profile.chapter", {
            index: options.chapter.overallIndex,
            total: TOTAL_CHAPTERS,
            title: chapterTitle(t, options.chapter.chapter),
          }),
        ].join("\n")
      : t("adventure.views.profile.storyDone"),
    [
      t("adventure.views.profile.streak", {
        count: character.streak,
        best: character.bestStreak,
      }),
      t("adventure.views.profile.activity", {
        explorations: formatNumber(t, character.explorations),
        victories: formatNumber(t, character.victories),
        dungeons: character.dungeonClears,
      }),
    ].join(" · "),
  ];

  const payload = toV2Payload(false, buildContainer(Colors.Primary, lines));
  appendRow(payload, [
    exploreButton(t, character.userId),
    viewButton(t, character.userId, "bag"),
    viewButton(t, character.userId, "map"),
    viewButton(t, character.userId, "story"),
    viewButton(t, character.userId, "quests"),
  ]);
  return navigationRow(payload, t, character.userId, [
    "shop",
    "forge",
    "dungeon",
    "trades",
    "achievements",
  ]);
}

export function statsView(
  character: AdventureCharacter,
  items: AdventureItem[],
  t: Translator,
): V2MessagePayload {
  const stats = computeStats(character, items);
  const lines = [
    t("adventure.views.stats.title"),
    character.statPoints > 0
      ? t("adventure.views.stats.available", { count: character.statPoints })
      : t("adventure.views.stats.none"),
    [
      t("adventure.views.stats.might", {
        value: character.might,
        attack: formatNumber(t, stats.attack),
        maxHp: formatNumber(t, stats.maxHp),
      }),
      t("adventure.views.stats.agility", {
        value: character.agility,
        crit: stats.crit,
        dodge: stats.dodge,
      }),
      t("adventure.views.stats.spirit", {
        value: character.spirit,
        power: formatNumber(t, stats.power),
      }),
    ].join("\n"),
  ];
  return toV2Payload(true, buildContainer(Colors.Primary, lines));
}

export function leaderboardView(
  entries: AdventureCharacter[],
  t: Translator,
  viewer: { userId: string; rank: number },
): V2MessagePayload {
  const medals = ["🥇", "🥈", "🥉"];
  const rows = entries.map((entry, index) => {
    const definition = classDefinition(entry.characterClass);
    const highlight = entry.userId === viewer.userId ? "**" : "";
    const name = entry.username ?? t("adventure.views.unnamed");
    return t("adventure.views.leaderboard.row", {
      position: medals[index] ?? `\`${index + 1}.\``,
      name: `${highlight}${name}${highlight}`,
      emoji: definition.emoji,
      level: entry.level,
      act: entry.actIndex + 1,
      xp: formatNumber(t, entry.totalXp),
    });
  });

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Primary, [
      t("adventure.views.leaderboard.title"),
      rows.length > 0 ? rows.join("\n") : t("adventure.views.leaderboard.empty"),
      t("adventure.views.leaderboard.yourRank", { rank: formatNumber(t, viewer.rank) }),
    ]),
  );
  return navigationRow(payload, t, viewer.userId, ["profile", "achievements", "journal"]);
}

export interface AchievementRow {
  emoji: string;
  name: string;
  description: string;
}

export function achievementsView(
  userId: string,
  t: Translator,
  unlocked: AchievementRow[],
  locked: AchievementRow[],
): V2MessagePayload {
  const lines = [
    t("adventure.views.achievements.title", {
      unlocked: unlocked.length,
      total: unlocked.length + locked.length,
    }),
    unlocked.length > 0
      ? unlocked
          .map((entry) =>
            t("adventure.views.achievements.unlockedRow", { check: checkbox(true), ...entry }),
          )
          .join("\n")
      : t("adventure.views.achievements.empty"),
  ];
  if (locked.length > 0) {
    lines.push(
      locked
        .slice(0, 8)
        .map((entry) =>
          t("adventure.views.achievements.lockedRow", { check: checkbox(false), ...entry }),
        )
        .join("\n"),
    );
  }
  const payload = toV2Payload(false, buildContainer(Colors.Premium, lines));
  return navigationRow(payload, t, userId, ["profile", "leaderboard", "journal"]);
}

/**
 * Map of the open regions. The current position is announced first and repeated on its row: one
 * button per region travels without retyping a command, the one of the current region staying
 * disabled to mark where the player stands.
 */
export function mapView(
  character: AdventureCharacter,
  zones: ZoneDefinition[],
  t: Translator,
): V2MessagePayload {
  const current = zones.find((zone) => zone.id === character.zoneId);

  const lines = [
    t("adventure.views.map.title"),
    current
      ? t("adventure.views.map.here", {
          emoji: current.emoji,
          zone: zoneName(t, current),
          description: zoneDescription(t, current),
        })
      : t("adventure.views.map.unknown"),
    zones
      .map((zone) => {
        const here = zone.id === character.zoneId;
        return t("adventure.views.map.row", {
          marker: here ? "📍 " : "",
          emoji: zone.emoji,
          zone: zoneName(t, zone),
          level: zone.minLevel,
          suffix: here ? t("adventure.views.map.youAreHere") : "",
        });
      })
      .join("\n"),
    t("adventure.views.map.hint"),
  ];

  const payload = toV2Payload(false, buildContainer(Colors.Primary, lines));

  // Four buttons per row: beyond that Discord truncates the longest region labels.
  for (let index = 0; index < zones.length; index += 4) {
    appendRow(
      payload,
      zones
        .slice(index, index + 4)
        .map((zone) => travelButton(t, character.userId, zone, zone.id === character.zoneId)),
    );
  }

  return navigationRow(payload, t, character.userId, ["profile", "bag", "story"]);
}

/**
 * Travel button. The one of the current region is disabled and pinned: it is the clearest marker
 * of where the player stands, far more than a mention in the text.
 */
function travelButton(
  t: Translator,
  userId: string,
  zone: ZoneDefinition,
  here: boolean,
): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(`adventure:travel:${userId}:${zone.id}`)
    .setLabel(zoneName(t, zone).slice(0, 80))
    .setEmoji(here ? "📍" : zone.emoji)
    .setStyle(here ? ButtonStyle.Success : ButtonStyle.Secondary)
    .setDisabled(here);
}
