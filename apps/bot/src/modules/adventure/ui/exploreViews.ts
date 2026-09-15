import { ButtonBuilder, ButtonStyle } from "discord.js";
import type { AdventureCharacter } from "@gaulia/database";

import { Colors } from "../../../client/Constants";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import { itemLabel } from "../data/items";
import { ENERGY_MAX } from "../data/pacing";
import type { DungeonOutcome, DungeonStatus } from "../services/dungeon/dungeonService";
import type { ExploreOutcome } from "../services/exploration/exploreService";
import { appendRow, exploreButton, navigationRow, viewButton } from "./navigation";
import { formatDuration, formatNumber, gold } from "./format";

function lootLine(loot: { itemId: string; quantity: number }[]): string | null {
  if (loot.length === 0) return null;
  return `🎒 ${loot.map((entry) => `${entry.quantity} × ${itemLabel(entry.itemId)}`).join(" · ")}`;
}

function vitalsLine(character: AdventureCharacter): string {
  return `❤️ ${formatNumber(character.hp)} · ⚡ ${character.energy}/${ENERGY_MAX} · 🪙 ${formatNumber(character.gold)}`;
}

export function exploreView(outcome: ExploreOutcome): V2MessagePayload {
  const { zone, monster, combat } = outcome;
  const lines: string[] = [];

  if (outcome.kind === "COMBAT" && monster && combat) {
    lines.push(
      `## ${monster.emoji} ${combat.victory ? `${monster.name} vaincu` : `${monster.name} te repousse`}`,
      `${zone.emoji} ${zone.name} · niveau ${monster.level}`,
      combat.highlights.join("\n"),
    );
  } else if (outcome.kind === "TROUVAILLE") {
    lines.push(`## 🔎 Trouvaille`, `${zone.emoji} ${zone.name}`);
  } else {
    lines.push(`## 🧭 Exploration`, `${zone.emoji} ${zone.name}`, `*${outcome.ambiance ?? ""}*`);
  }

  const gains = [
    outcome.xp > 0 ? `✨ +${formatNumber(outcome.xp)} XP` : null,
    outcome.gold > 0 ? `🪙 +${formatNumber(outcome.gold)}` : null,
    lootLine(outcome.loot),
  ].filter(Boolean);
  if (gains.length > 0) lines.push(gains.join(" · "));

  lines.push(vitalsLine(outcome.character));
  if (outcome.notices.length > 0) lines.push(outcome.notices.join("\n"));

  const color =
    outcome.kind === "COMBAT" && combat && !combat.victory ? Colors.Warning : Colors.Success;
  const payload = toV2Payload(false, buildContainer(color, lines));
  const userId = outcome.character.userId;

  // Le bouton de soin n'apparaît que quand il sert : inutile de l'afficher sans potion au sac.
  const actions = [exploreButton(userId, "Explorer encore"), viewButton(userId, "sac")];
  if (outcome.canHeal) {
    actions.push(
      new ButtonBuilder()
        .setCustomId(`adventure:heal:${userId}`)
        .setLabel("Se soigner")
        .setEmoji("🧪")
        .setStyle(ButtonStyle.Success),
    );
  }
  appendRow(payload, actions);

  return navigationRow(payload, userId, ["carte", "quetes", "histoire"]);
}

export function dungeonStatusView(
  character: AdventureCharacter,
  status: DungeonStatus,
): V2MessagePayload {
  const lines = [
    `## 🚪 Donjon — ${status.actTitle}`,
    `Gardien : ${status.guardian.emoji} **${status.guardian.name}** (niveau ${status.guardian.level})`,
    status.cooldownMs > 0
      ? `⏳ Prochaine tentative dans **${formatDuration(status.cooldownMs)}**.`
      : "Le passage est ouvert : affronte le gardien d'un bouton, ou `/aventure donjon lancer:true`.",
    `Un donjon remporté rapporte l'essentiel de tes fragments d'écho — c'est le rendez-vous de la semaine.`,
    vitalsLine(character),
  ];
  const payload = toV2Payload(false, buildContainer(Colors.Premium, lines));
  if (status.cooldownMs === 0) {
    appendRow(payload, [
      new ButtonBuilder()
        .setCustomId(`adventure:dungeon:${character.userId}`)
        .setLabel("Affronter le gardien")
        .setEmoji("⚔️")
        .setStyle(ButtonStyle.Danger),
    ]);
  }
  return navigationRow(payload, character.userId, ["profil", "sac", "histoire"]);
}

export function dungeonResultView(outcome: DungeonOutcome): V2MessagePayload {
  const lines = [
    `## ${outcome.guardian.emoji} ${outcome.combat.victory ? "Gardien vaincu" : "Le gardien tient bon"}`,
    `**${outcome.guardian.name}** — niveau ${outcome.guardian.level}`,
    outcome.combat.highlights.join("\n"),
  ];

  if (outcome.combat.victory) {
    const gains = [
      `✨ +${formatNumber(outcome.xp)} XP`,
      `🪙 +${formatNumber(outcome.gold)}`,
      lootLine(outcome.loot),
    ].filter(Boolean);
    lines.push(gains.join(" · "));
  }

  lines.push(vitalsLine(outcome.character));
  if (outcome.notices.length > 0) lines.push(outcome.notices.join("\n"));

  const payload = toV2Payload(
    false,
    buildContainer(outcome.combat.victory ? Colors.Success : Colors.Danger, lines),
  );
  return navigationRow(payload, outcome.character.userId, ["profil", "sac", "histoire", "quetes"]);
}

export function travelView(
  character: AdventureCharacter,
  zone: { emoji: string; name: string; description: string },
  notices: string[],
): V2MessagePayload {
  const payload = toV2Payload(
    false,
    buildContainer(Colors.Success, [
      `## ${zone.emoji} En route pour ${zone.name}`,
      `*${zone.description}*`,
      `${vitalsLine(character)} · ${gold(character.gold)}`,
      ...(notices.length > 0 ? [notices.join("\n")] : []),
    ]),
  );
  appendRow(payload, [exploreButton(character.userId), viewButton(character.userId, "carte")]);
  return payload;
}
