"use client";

import { formatDateTime, formatNumber } from "@/lib/format";
import type { AdventureCatalogue, AdventurePlayerDetail } from "@/lib/types";

const CLASS_LABELS: Record<string, string> = {
  GUERRIER: "🛡️ Guerrier",
  MAGE: "🔮 Mage",
  RODEUR: "🏹 Rôdeur",
};

const LOG_PREFIX: Record<string, string> = {
  STORY: "📖",
  DUNGEON: "🚪",
  LEVEL_UP: "🏅",
  TRADE: "🤝",
  ADMIN: "🛠️",
};

/** Fiche complète d'un joueur : progression, caractéristiques, inventaire, quêtes et journal. */
export function PlayerSheet({
  detail,
  catalogue,
}: {
  detail: AdventurePlayerDetail;
  catalogue: AdventureCatalogue | null;
}) {
  const { character, items, quests, achievements, logs, pendingTrades } = detail;
  const act = catalogue?.acts[character.actIndex];
  const chapter = act?.chapters[character.chapterIndex];
  const chaptersDone =
    (catalogue?.acts.slice(0, character.actIndex) ?? []).reduce(
      (total, entry) => total + entry.chapters.length,
      0,
    ) + character.chapterIndex;

  const itemName = (itemId: string): string => {
    const item = catalogue?.items.find((entry) => entry.id === itemId);
    return item ? `${item.emoji} ${item.name}` : itemId;
  };

  return (
    <div className="adventure-sheet">
      <div className="kpi-grid">
        <div className="card stat-tile">
          <span className="stat-label">Niveau</span>
          <span className="stat-value">{character.level}</span>
          <span className="stat-hint">{formatNumber(character.totalXp)} XP au total</span>
        </div>
        <div className="card stat-tile">
          <span className="stat-label">Scénario</span>
          <span className="stat-value">
            {chaptersDone}/{catalogue?.totalChapters ?? "—"}
          </span>
          <span className="stat-hint">
            {character.storyEndedAt
              ? "Histoire terminée"
              : `${act?.title ?? `Acte ${character.actIndex + 1}`} — ${chapter?.title ?? `chapitre ${character.chapterIndex + 1}`}`}
          </span>
        </div>
        <div className="card stat-tile">
          <span className="stat-label">Bourse</span>
          <span className="stat-value">{formatNumber(character.gold)}</span>
          <span className="stat-hint">
            {formatNumber(character.echoes)} fragment(s) d&apos;écho
          </span>
        </div>
        <div className="card stat-tile">
          <span className="stat-label">Énergie</span>
          <span className="stat-value">
            {character.energy}/{catalogue?.maxEnergy ?? "—"}
          </span>
          <span className="stat-hint">{formatNumber(character.hp)} PV</span>
        </div>
      </div>

      <section className="card">
        <h3 className="card-title">Caractéristiques</h3>
        <dl className="shard-metrics">
          <div>
            <dt>Classe</dt>
            <dd>{CLASS_LABELS[character.characterClass] ?? character.characterClass}</dd>
          </div>
          <div>
            <dt>Force / Agilité / Esprit</dt>
            <dd>
              {character.might} / {character.agility} / {character.spirit}
            </dd>
          </div>
          <div>
            <dt>Points à répartir</dt>
            <dd>{character.statPoints}</dd>
          </div>
          <div>
            <dt>Explorations</dt>
            <dd>{formatNumber(character.explorations)}</dd>
          </div>
          <div>
            <dt>Victoires / Défaites</dt>
            <dd>
              {formatNumber(character.victories)} / {formatNumber(character.defeats)}
            </dd>
          </div>
          <div>
            <dt>Donjons</dt>
            <dd>{character.dungeonClears}</dd>
          </div>
          <div>
            <dt>Série</dt>
            <dd>
              {character.streak} j (record {character.bestStreak})
            </dd>
          </div>
          <div>
            <dt>Renforcements</dt>
            <dd>{formatNumber(character.upgrades)}</dd>
          </div>
          <div>
            <dt>Échanges conclus</dt>
            <dd>{formatNumber(character.trades)}</dd>
          </div>
          <div>
            <dt>Hauts faits</dt>
            <dd>{achievements.length}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h3 className="card-title">Inventaire ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-muted">Sac vide.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Objet</th>
                  <th className="numeric">Quantité</th>
                  <th className="numeric">Renfort</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{itemName(row.itemId)}</td>
                    <td className="numeric">{formatNumber(row.quantity)}</td>
                    <td className="numeric">
                      {row.upgradeLevel > 0 ? `+${row.upgradeLevel}` : "—"}
                    </td>
                    <td>{row.equipped ? "Porté" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">Quêtes en cours</h3>
        {quests.length === 0 ? (
          <p className="text-muted">Aucun lot de quêtes enregistré.</p>
        ) : (
          <ul className="data-summary">
            {quests.slice(0, 10).map((quest) => (
              <li key={quest.id}>
                <span>
                  {quest.kind === "DAILY" ? "Quotidienne" : "Hebdomadaire"} ·{" "}
                  {quest.label ?? quest.questId}
                </span>
                <strong>
                  {formatNumber(quest.progress)} / {formatNumber(quest.target)}
                  {quest.claimedAt ? " ✅" : ""}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">Échanges en attente ({pendingTrades.length})</h3>
        {pendingTrades.length === 0 ? (
          <p className="text-muted">Aucune proposition ouverte.</p>
        ) : (
          <ul className="data-summary">
            {pendingTrades.map((trade) => {
              const side = (
                items: { itemId: string; quantity: number }[],
                gold: number,
              ): string => {
                const parts = items.map((entry) => `${entry.quantity} × ${itemName(entry.itemId)}`);
                if (gold > 0) parts.push(`${formatNumber(gold)} pièces`);
                return parts.join(" + ") || "rien";
              };
              const outgoing = trade.initiatorId === character.userId;

              return (
                <li key={trade.id}>
                  <span>
                    #{trade.id} {outgoing ? "→ " : "← "}
                    {outgoing
                      ? (trade.targetName ?? trade.targetId)
                      : (trade.initiatorName ?? trade.initiatorId)}{" "}
                    · {side(trade.offeredItems, trade.offeredGold)} contre{" "}
                    {side(trade.requestedItems, trade.requestedGold)}
                  </span>
                  <strong>{formatDateTime(trade.expiresAt)}</strong>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">Journal</h3>
        {logs.length === 0 ? (
          <p className="text-muted">Rien à signaler.</p>
        ) : (
          <ul className="data-summary">
            {logs.map((log) => (
              <li key={log.id}>
                <span>
                  {LOG_PREFIX[log.type] ?? "•"} {log.message}
                </span>
                <strong>{formatDateTime(log.createdAt)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
