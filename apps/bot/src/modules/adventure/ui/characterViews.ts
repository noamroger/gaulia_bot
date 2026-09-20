import { ButtonBuilder, ButtonStyle } from "discord.js";
import type { AdventureCharacter, AdventureItem } from "@gaulia/database";

import { Colors } from "../../../client/Constants";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import { classDefinition } from "../data/classes";
import { itemLabel, SLOT_LABELS, type ItemSlot } from "../data/items";
import { ENERGY_MAX, xpToNextLevel } from "../data/pacing";
import { TOTAL_CHAPTERS } from "../data/story";
import { requireZone, type ZoneDefinition } from "../data/zones";
import { computeStats, equippedIn } from "../services/character/statsService";
import { xpRatio } from "../services/character/progressionService";
import type { ChapterStatus } from "../services/progress/storyService";
import { checkbox, counter, formatNumber, progressBar } from "./format";
import { appendRow, exploreButton, navigationRow, viewButton } from "./navigation";

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
    return `${SLOT_LABELS[slot]} · ${row ? itemLabel(row.itemId) : "-"}`;
  });

  const lines = [
    `## ${definition.emoji} ${character.username ?? "Aventurier"}${options.title ? ` - *${options.title}*` : ""}`,
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
      ? `**Histoire** ${options.chapter.actEmoji} ${options.chapter.actTitle}\nChapitre ${options.chapter.overallIndex}/${TOTAL_CHAPTERS} - *${options.chapter.chapter.title}*`
      : "**Histoire** 🏆 Scénario terminé.",
    `🔥 Série de **${character.streak} jour(s)** (record : ${character.bestStreak}) · 🗺️ ${formatNumber(character.explorations)} explorations · ⚔️ ${formatNumber(character.victories)} victoires · 🚪 ${character.dungeonClears} donjons`,
  ];

  const payload = toV2Payload(false, buildContainer(Colors.Primary, lines));
  appendRow(payload, [
    exploreButton(character.userId),
    viewButton(character.userId, "sac"),
    viewButton(character.userId, "carte"),
    viewButton(character.userId, "histoire"),
    viewButton(character.userId, "quetes"),
  ]);
  return navigationRow(payload, character.userId, [
    "boutique",
    "forge",
    "donjon",
    "echanges",
    "hauts-faits",
  ]);
}

export function statsView(character: AdventureCharacter, items: AdventureItem[]): V2MessagePayload {
  const stats = computeStats(character, items);
  const lines = [
    "### 🎯 Répartition des caractéristiques",
    character.statPoints > 0
      ? `Tu as **${character.statPoints} point(s)** à placer avec \`/aventure ameliorer caracteristique:<...> points:<n>\`.`
      : "Aucun point disponible : monte d'un niveau pour en gagner.",
    [
      `**Force** ${character.might} - dégâts physiques et points de vie (attaque ${formatNumber(stats.attack)}, PV max ${formatNumber(stats.maxHp)})`,
      `**Agilité** ${character.agility} - critique, esquive et défense (${stats.crit} % / ${stats.dodge} %)`,
      `**Esprit** ${character.spirit} - dégâts magiques (puissance ${formatNumber(stats.power)})`,
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
    return `${medals[index] ?? `\`${index + 1}.\``} ${highlight}${entry.username ?? "Aventurier"}${highlight} - ${definition.emoji} niveau ${entry.level} · acte ${entry.actIndex + 1} · ${formatNumber(entry.totalXp)} XP`;
  });

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Primary, [
      "## 🏅 Les plus grands aventuriers",
      rows.length > 0 ? rows.join("\n") : "Personne n'a encore pris la route.",
      `Ton rang : **#${formatNumber(viewer.rank)}**`,
    ]),
  );
  return navigationRow(payload, viewer.userId, ["profil", "hauts-faits", "journal"]);
}

export function achievementsView(
  userId: string,
  unlocked: { id: string; emoji: string; name: string; description: string }[],
  locked: { emoji: string; name: string; description: string }[],
): V2MessagePayload {
  const lines = [
    `## 🏆 Hauts faits - ${unlocked.length}/${unlocked.length + locked.length}`,
    unlocked.length > 0
      ? unlocked
          .map(
            (entry) => `${checkbox(true)} ${entry.emoji} **${entry.name}** - ${entry.description}`,
          )
          .join("\n")
      : "Aucun haut fait pour l'instant.",
  ];
  if (locked.length > 0) {
    lines.push(
      locked
        .slice(0, 8)
        .map((entry) => `${checkbox(false)} ${entry.emoji} ${entry.name} - ${entry.description}`)
        .join("\n"),
    );
  }
  const payload = toV2Payload(false, buildContainer(Colors.Premium, lines));
  return navigationRow(payload, userId, ["profil", "classement", "journal"]);
}

/**
 * Carte des régions ouvertes. La position courante est annoncée en tête et rappelée sur sa ligne :
 * un bouton par région permet de voyager sans retaper de commande, celui de la région actuelle
 * restant désactivé pour marquer où l'on se trouve.
 */
export function mapView(character: AdventureCharacter, zones: ZoneDefinition[]): V2MessagePayload {
  const current = zones.find((zone) => zone.id === character.zoneId);

  const lines = [
    "## 🗺️ Les Terres de Gaulia",
    current
      ? `> 📍 **Tu es à ${current.emoji} ${current.name}**\n> *${current.description}*`
      : "> 📍 **Position inconnue**",
    zones
      .map((zone) => {
        const here = zone.id === character.zoneId;
        const marker = here ? "📍 " : "";
        const suffix = here ? " · **tu es ici**" : "";
        return `${marker}${zone.emoji} **${zone.name}** - niveau conseillé ${zone.minLevel}${suffix}`;
      })
      .join("\n"),
    "Choisis ta destination d'un bouton, ou `/aventure voyager region:<nom>`.",
  ];

  const payload = toV2Payload(false, buildContainer(Colors.Primary, lines));

  // Quatre boutons par rangée : au-delà, Discord tronque l'intitulé des régions les plus longues.
  for (let index = 0; index < zones.length; index += 4) {
    appendRow(
      payload,
      zones
        .slice(index, index + 4)
        .map((zone) => travelButton(character.userId, zone, zone.id === character.zoneId)),
    );
  }

  return navigationRow(payload, character.userId, ["profil", "sac", "histoire"]);
}

/**
 * Bouton de voyage. Celui de la région courante est désactivé et marqué d'une épingle : c'est le
 * repère le plus lisible pour savoir où l'on se trouve, bien plus qu'une mention dans le texte.
 */
function travelButton(userId: string, zone: ZoneDefinition, here: boolean): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(`adventure:travel:${userId}:${zone.id}`)
    .setLabel(zone.name.slice(0, 80))
    .setEmoji(here ? "📍" : zone.emoji)
    .setStyle(here ? ButtonStyle.Success : ButtonStyle.Secondary)
    .setDisabled(here);
}
