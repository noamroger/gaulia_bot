"use client";

import { useLocale, useTranslation } from "@/i18n";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { AdventureCatalogue, AdventurePlayerDetail } from "@/lib/types";

/** Journal entry types, as stored; the emoji is the whole display. */
const LOG_PREFIX: Record<string, string> = {
  STORY: "📖",
  DUNGEON: "🚪",
  LEVEL_UP: "🏅",
  TRADE: "🤝",
  ADMIN: "🛠️",
};

/** Full sheet of a player: progression, stats, inventory, quests and journal. */
export function PlayerSheet({
  detail,
  catalogue,
}: {
  detail: AdventurePlayerDetail;
  catalogue: AdventureCatalogue | null;
}) {
  const t = useTranslation();
  const locale = useLocale();
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

  const actTitle =
    act?.title ?? t("adventure.admin.sheet.actFallback", { number: character.actIndex + 1 });
  const chapterTitle =
    chapter?.title ??
    t("adventure.admin.sheet.chapterFallback", { number: character.chapterIndex + 1 });

  return (
    <div className="adventure-sheet">
      <div className="kpi-grid">
        <div className="card stat-tile">
          <span className="stat-label">{t("adventure.admin.sheet.level")}</span>
          <span className="stat-value">{character.level}</span>
          <span className="stat-hint">
            {t("adventure.admin.sheet.totalXp", {
              value: formatNumber(character.totalXp, locale),
            })}
          </span>
        </div>
        <div className="card stat-tile">
          <span className="stat-label">{t("adventure.admin.sheet.story")}</span>
          <span className="stat-value">
            {chaptersDone}/{catalogue?.totalChapters ?? "-"}
          </span>
          <span className="stat-hint">
            {character.storyEndedAt
              ? t("adventure.admin.sheet.storyDone")
              : `${actTitle} - ${chapterTitle}`}
          </span>
        </div>
        <div className="card stat-tile">
          <span className="stat-label">{t("adventure.admin.sheet.purse")}</span>
          <span className="stat-value">{formatNumber(character.gold, locale)}</span>
          <span className="stat-hint">
            {t("adventure.admin.sheet.echoes", {
              count: character.echoes,
              value: formatNumber(character.echoes, locale),
            })}
          </span>
        </div>
        <div className="card stat-tile">
          <span className="stat-label">{t("adventure.admin.sheet.energy")}</span>
          <span className="stat-value">
            {character.energy}/{catalogue?.maxEnergy ?? "-"}
          </span>
          <span className="stat-hint">
            {t("adventure.admin.sheet.hp", { value: formatNumber(character.hp, locale) })}
          </span>
        </div>
      </div>

      <section className="card">
        <h3 className="card-title">{t("adventure.admin.sheet.stats.title")}</h3>
        <dl className="shard-metrics">
          <div>
            <dt>{t("adventure.admin.sheet.stats.class")}</dt>
            <dd>{t(`adventure.admin.class.${character.characterClass}`)}</dd>
          </div>
          <div>
            <dt>{t("adventure.admin.sheet.stats.attributes")}</dt>
            <dd>
              {character.might} / {character.agility} / {character.spirit}
            </dd>
          </div>
          <div>
            <dt>{t("adventure.admin.sheet.stats.statPoints")}</dt>
            <dd>{character.statPoints}</dd>
          </div>
          <div>
            <dt>{t("adventure.admin.sheet.stats.explorations")}</dt>
            <dd>{formatNumber(character.explorations, locale)}</dd>
          </div>
          <div>
            <dt>{t("adventure.admin.sheet.stats.record")}</dt>
            <dd>
              {formatNumber(character.victories, locale)} /{" "}
              {formatNumber(character.defeats, locale)}
            </dd>
          </div>
          <div>
            <dt>{t("adventure.admin.sheet.stats.dungeons")}</dt>
            <dd>{character.dungeonClears}</dd>
          </div>
          <div>
            <dt>{t("adventure.admin.sheet.stats.streak")}</dt>
            <dd>
              {t("adventure.admin.sheet.stats.streakValue", {
                count: character.streak,
                best: character.bestStreak,
              })}
            </dd>
          </div>
          <div>
            <dt>{t("adventure.admin.sheet.stats.upgrades")}</dt>
            <dd>{formatNumber(character.upgrades, locale)}</dd>
          </div>
          <div>
            <dt>{t("adventure.admin.sheet.stats.trades")}</dt>
            <dd>{formatNumber(character.trades, locale)}</dd>
          </div>
          <div>
            <dt>{t("adventure.admin.sheet.stats.achievements")}</dt>
            <dd>{achievements.length}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h3 className="card-title">
          {t("adventure.admin.sheet.inventory.title", { count: items.length })}
        </h3>
        {items.length === 0 ? (
          <p className="text-muted">{t("adventure.admin.sheet.inventory.empty")}</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("adventure.admin.sheet.inventory.columnItem")}</th>
                  <th className="numeric">{t("adventure.admin.sheet.inventory.columnQuantity")}</th>
                  <th className="numeric">{t("adventure.admin.sheet.inventory.columnUpgrade")}</th>
                  <th>{t("adventure.admin.sheet.inventory.columnState")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{itemName(row.itemId)}</td>
                    <td className="numeric">{formatNumber(row.quantity, locale)}</td>
                    <td className="numeric">
                      {row.upgradeLevel > 0 ? `+${row.upgradeLevel}` : "-"}
                    </td>
                    <td>{row.equipped ? t("adventure.admin.sheet.inventory.equipped") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">{t("adventure.admin.sheet.quests.title")}</h3>
        {quests.length === 0 ? (
          <p className="text-muted">{t("adventure.admin.sheet.quests.empty")}</p>
        ) : (
          <ul className="data-summary">
            {quests.slice(0, 10).map((quest) => (
              <li key={quest.id}>
                <span>
                  {t(`adventure.admin.sheet.quests.${quest.kind}`)} · {quest.label ?? quest.questId}
                </span>
                <strong>
                  {formatNumber(quest.progress, locale)} / {formatNumber(quest.target, locale)}
                  {quest.claimedAt ? " ✅" : ""}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">
          {t("adventure.admin.sheet.trades.title", { count: pendingTrades.length })}
        </h3>
        {pendingTrades.length === 0 ? (
          <p className="text-muted">{t("adventure.admin.sheet.trades.empty")}</p>
        ) : (
          <ul className="data-summary">
            {pendingTrades.map((trade) => {
              const side = (
                tradedItems: { itemId: string; quantity: number }[],
                gold: number,
              ): string => {
                const parts = tradedItems.map(
                  (entry) => `${entry.quantity} × ${itemName(entry.itemId)}`,
                );
                if (gold > 0) {
                  parts.push(
                    t("adventure.admin.sheet.trades.gold", {
                      count: gold,
                      value: formatNumber(gold, locale),
                    }),
                  );
                }
                return parts.join(" + ") || t("adventure.admin.sheet.trades.nothing");
              };
              const outgoing = trade.initiatorId === character.userId;

              return (
                <li key={trade.id}>
                  <span>
                    #{trade.id} {outgoing ? "→ " : "← "}
                    {outgoing
                      ? (trade.targetName ?? trade.targetId)
                      : (trade.initiatorName ?? trade.initiatorId)}{" "}
                    · {side(trade.offeredItems, trade.offeredGold)}{" "}
                    {t("adventure.admin.sheet.trades.versus")}{" "}
                    {side(trade.requestedItems, trade.requestedGold)}
                  </span>
                  <strong>{formatDateTime(trade.expiresAt, locale)}</strong>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">{t("adventure.admin.sheet.logs.title")}</h3>
        {logs.length === 0 ? (
          <p className="text-muted">{t("adventure.admin.sheet.logs.empty")}</p>
        ) : (
          <ul className="data-summary">
            {logs.map((log) => (
              <li key={log.id}>
                <span>
                  {LOG_PREFIX[log.type] ?? "•"} {log.message}
                </span>
                <strong>{formatDateTime(log.createdAt, locale)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
