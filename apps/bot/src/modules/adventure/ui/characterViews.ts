import type { AdventureCharacter, AdventureItem } from "@gaulia/database";

import { Colors } from "../../../client/Constants";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import { classDefinition } from "../data/classes";
import { itemLabel, SLOT_LABELS, type ItemSlot } from "../data/items";
import { ENERGY_MAX, xpToNextLevel } from "../data/pacing";
import { TOTAL_CHAPTERS } from "../data/story";
import { requireZone } from "../data/zones";
import { computeStats, equippedIn } from "../services/character/statsService";
import { xpRatio } from "../services/character/progressionService";
import type { ChapterStatus } from "../services/progress/storyService";
import { checkbox, counter, formatNumber, progressBar } from "./format";

const SLOTS: ItemSlot[] = ["arme", "armure", "talisman"];

export function profileView(
  character: AdventureCharacter,
  items: AdventureItem[],
  options: { title: string | null; rank: number; chapter: ChapterStatus | null },
): V2MessagePayload {
  const stats = computeStats(character, items);
  const definition = classDefinition(character.characterClass);
  const zone = requireZone(character.zoneId);
  const needed = xpToNextLevel(character.level);

  const equipment = SLOTS.map((slot) => {
    const row = equippedIn(items, slot);
    return `${SLOT_LABELS[slot]} · ${row ? itemLabel(row.itemId) : "—"}`;
  });

  const lines = [
    `## ${definition.emoji} ${character.username ?? "Aventurier"}${options.title ? ` — *${options.title}*` : ""}`,
    `${definition.name} · niveau **${character.level}** · ${zone.emoji} ${zone.name} · rang #${formatNumber(options.rank)}`,
    [
      `❤️ **${formatNumber(character.hp)} / ${formatNumber(stats.maxHp)}** · ⚡ **${character.energy} / ${ENERGY_MAX}**`,
      `🪙 ${formatNumber(character.gold)} · 🔷 ${formatNumber(character.echoes)} fragments`,
    ].join("\n"),
    `**Expérience** ${progressBar(xpRatio(character))} ${needed === 0 ? "niveau maximum" : counter(character.xp, needed)}`,
    [
      `⚔️ Attaque **${formatNumber(stats.attack)}** · 🔮 Puissance **${formatNumber(stats.power)}** · 🛡️ Défense **${formatNumber(stats.defense)}**`,
      `💥 Critique **${stats.crit} %** · 🌀 Esquive **${stats.dodge} %**`,
      `Force ${character.might} · Agilité ${character.agility} · Esprit ${character.spirit}${character.statPoints > 0 ? ` · **${character.statPoints} point(s) à répartir**` : ""}`,
    ].join("\n"),
    `**Équipement**\n${equipment.join("\n")}`,
    options.chapter
      ? `**Histoire** ${options.chapter.actEmoji} ${options.chapter.actTitle}\nChapitre ${options.chapter.overallIndex}/${TOTAL_CHAPTERS} — *${options.chapter.chapter.title}*`
      : "**Histoire** 🏆 Scénario terminé.",
    `🔥 Série de **${character.streak} jour(s)** (record : ${character.bestStreak}) · 🗺️ ${formatNumber(character.explorations)} explorations · ⚔️ ${formatNumber(character.victories)} victoires · 🚪 ${character.dungeonClears} donjons`,
  ];

  return toV2Payload(false, buildContainer(Colors.Primary, lines));
}

export function statsView(character: AdventureCharacter, items: AdventureItem[]): V2MessagePayload {
  const stats = computeStats(character, items);
  const lines = [
    "### 🎯 Répartition des caractéristiques",
    character.statPoints > 0
      ? `Tu as **${character.statPoints} point(s)** à placer avec \`/aventure ameliorer caracteristique:<...> points:<n>\`.`
      : "Aucun point disponible : monte d'un niveau pour en gagner.",
    [
      `**Force** ${character.might} — dégâts physiques et points de vie (attaque ${formatNumber(stats.attack)}, PV max ${formatNumber(stats.maxHp)})`,
      `**Agilité** ${character.agility} — critique, esquive et défense (${stats.crit} % / ${stats.dodge} %)`,
      `**Esprit** ${character.spirit} — dégâts magiques (puissance ${formatNumber(stats.power)})`,
    ].join("\n"),
  ];
  return toV2Payload(true, buildContainer(Colors.Primary, lines));
}

export function leaderboardView(
  entries: AdventureCharacter[],
  viewer: { userId: string; rank: number },
): V2MessagePayload {
  const medals = ["🥇", "🥈", "🥉"];
  const rows = entries.map((entry, index) => {
    const definition = classDefinition(entry.characterClass);
    const highlight = entry.userId === viewer.userId ? "**" : "";
    return `${medals[index] ?? `\`${index + 1}.\``} ${highlight}${entry.username ?? "Aventurier"}${highlight} — ${definition.emoji} niveau ${entry.level} · acte ${entry.actIndex + 1} · ${formatNumber(entry.totalXp)} XP`;
  });

  return toV2Payload(
    false,
    buildContainer(Colors.Primary, [
      "## 🏅 Les plus grands aventuriers",
      rows.length > 0 ? rows.join("\n") : "Personne n'a encore pris la route.",
      `Ton rang : **#${formatNumber(viewer.rank)}**`,
    ]),
  );
}

export function achievementsView(
  unlocked: { id: string; emoji: string; name: string; description: string }[],
  locked: { emoji: string; name: string; description: string }[],
): V2MessagePayload {
  const lines = [
    `## 🏆 Hauts faits — ${unlocked.length}/${unlocked.length + locked.length}`,
    unlocked.length > 0
      ? unlocked
          .map(
            (entry) => `${checkbox(true)} ${entry.emoji} **${entry.name}** — ${entry.description}`,
          )
          .join("\n")
      : "Aucun haut fait pour l'instant.",
  ];
  if (locked.length > 0) {
    lines.push(
      locked
        .slice(0, 8)
        .map((entry) => `${checkbox(false)} ${entry.emoji} ${entry.name} — ${entry.description}`)
        .join("\n"),
    );
  }
  return toV2Payload(false, buildContainer(Colors.Premium, lines));
}

/** Carte des régions, avec un bouton par zone accessible (au plus cinq). */
export function mapView(
  character: AdventureCharacter,
  zones: { id: string; emoji: string; name: string; description: string; minLevel: number }[],
): V2MessagePayload {
  const lines = [
    "## 🗺️ Les Terres de Gaulia",
    zones
      .map((zone) => {
        const here = zone.id === character.zoneId ? " ← *tu es ici*" : "";
        return `${zone.emoji} **${zone.name}** — niveau conseillé ${zone.minLevel}${here}\n${zone.description}`;
      })
      .join("\n\n"),
    "Voyage avec `/aventure voyager region:<nom>`.",
  ];
  return toV2Payload(false, buildContainer(Colors.Primary, lines));
}
