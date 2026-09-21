"use client";

import { useEffect, useMemo, useState } from "react";

import { InterventionForm } from "@/components/adventure/InterventionForm";
import { PlayerSheet } from "@/components/adventure/PlayerSheet";
import { useLocale, useTranslation, type Translator } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import { userAvatarUrl } from "@/lib/discordCdn";
import { formatDateTime, formatNumber } from "@/lib/format";
import type {
  AdventureCatalogue,
  AdventureIntervention,
  AdventurePlayer,
  AdventurePlayerDetail,
} from "@/lib/types";

/** Keyed on the class names the API sends. */
const CLASS_EMOJIS: Record<string, string> = {
  GUERRIER: "🛡️",
  MAGE: "🔮",
  RODEUR: "🏹",
};

function errorMessage(error: unknown, t: Translator): string {
  return error instanceof ApiError && error.status < 500 && !error.generic
    ? error.message
    : t("common.state.error");
}

export default function AdminAdventurePage() {
  const [players, setPlayers] = useState<AdventurePlayer[] | null>(null);
  const [catalogue, setCatalogue] = useState<AdventureCatalogue | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdventurePlayerDetail | null>(null);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const t = useTranslation();
  const locale = useLocale();

  useEffect(() => {
    api
      .get<AdventurePlayer[]>("/admin/adventure/players")
      .then(setPlayers)
      .catch(() => setPlayers([]));
    api
      .get<AdventureCatalogue>("/admin/adventure/catalogue")
      .then(setCatalogue)
      .catch(() => setCatalogue(null));
  }, []);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetail(null);
    api
      .get<AdventurePlayerDetail>(`/admin/adventure/players/${selected}`)
      .then((value) => {
        if (!cancelled) setDetail(value);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(errorMessage(loadError, t));
      });
    return () => {
      cancelled = true;
    };
  }, [selected, t]);

  const filtered = useMemo(() => {
    if (!players) return null;
    const needle = query.trim().toLowerCase();
    if (!needle) return players;
    return players.filter(
      (player) =>
        player.userId.includes(needle) || (player.username ?? "").toLowerCase().includes(needle),
    );
  }, [players, query]);

  async function applyIntervention(intervention: AdventureIntervention): Promise<void> {
    if (!selected) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.patch<AdventurePlayerDetail>(
        `/admin/adventure/players/${selected}`,
        intervention,
      );
      setDetail(updated);
      setPlayers((current) =>
        (current ?? []).map((player) =>
          player.userId === updated.character.userId ? { ...player, ...updated.character } : player,
        ),
      );
      setSuccess(t("admin.adventure.interventionApplied"));
    } catch (patchError) {
      setError(errorMessage(patchError, t));
    } finally {
      setPending(false);
    }
  }

  const totalPlayers = players?.length ?? 0;
  const finished = (players ?? []).filter((player) => player.storyEndedAt !== null).length;

  return (
    <div>
      <div className="kpi-grid">
        <div className="card stat-tile">
          <span className="stat-label">{t("admin.adventure.tiles.players")}</span>
          <span className="stat-value">{formatNumber(totalPlayers, locale)}</span>
          <span className="stat-hint">{t("admin.adventure.tiles.playersHint")}</span>
        </div>
        <div className="card stat-tile">
          <span className="stat-label">{t("admin.adventure.tiles.finished")}</span>
          <span className="stat-value">{formatNumber(finished, locale)}</span>
          <span className="stat-hint">
            {t("admin.adventure.tiles.finishedHint", {
              chapters: catalogue?.totalChapters ?? "-",
            })}
          </span>
        </div>
        <div className="card stat-tile">
          <span className="stat-label">{t("admin.adventure.tiles.topLevel")}</span>
          <span className="stat-value">
            {formatNumber(Math.max(0, ...(players ?? []).map((player) => player.level)), locale)}
          </span>
          <span className="stat-hint">
            {t("admin.adventure.tiles.topLevelHint", { level: catalogue?.maxLevel ?? "-" })}
          </span>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="search"
          className="search-input"
          placeholder={t("admin.adventure.searchPlaceholder")}
          aria-label={t("admin.adventure.searchLabel")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {error && <p className="notice notice-error">{error}</p>}
      {success && <p className="notice notice-success">{success}</p>}

      {filtered === null ? (
        <p className="text-muted">{t("common.state.loading")}</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">{t("admin.adventure.empty")}</div>
      ) : (
        <div className="card table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>{t("admin.adventure.table.player")}</th>
                <th className="numeric">{t("admin.adventure.table.level")}</th>
                <th>{t("admin.adventure.table.story")}</th>
                <th className="numeric">{t("admin.adventure.table.gold")}</th>
                <th className="numeric">{t("admin.adventure.table.echoes")}</th>
                <th>{t("admin.adventure.table.lastPlayed")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((player) => (
                <tr key={player.userId}>
                  <td>
                    <span className="guild-cell">
                      <img
                        className="user-avatar"
                        src={userAvatarUrl(player.userId, null)}
                        alt=""
                        width={28}
                        height={28}
                      />
                      <span>
                        {CLASS_EMOJIS[player.characterClass] ?? ""}{" "}
                        {player.username ?? player.userId}
                      </span>
                    </span>
                  </td>
                  <td className="numeric">{player.level}</td>
                  <td>
                    {player.storyEndedAt
                      ? t("admin.adventure.finished")
                      : t("admin.adventure.progress", {
                          act: player.actIndex + 1,
                          chapter: player.chapterIndex + 1,
                        })}
                  </td>
                  <td className="numeric">{formatNumber(player.gold, locale)}</td>
                  <td className="numeric">{formatNumber(player.echoes, locale)}</td>
                  <td>{player.lastPlayedAt ? formatDateTime(player.lastPlayedAt, locale) : "-"}</td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="button-secondary button-small"
                      onClick={() =>
                        setSelected((current) => (current === player.userId ? null : player.userId))
                      }
                    >
                      {selected === player.userId
                        ? t("admin.adventure.close")
                        : t("admin.adventure.open")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <>
          <h2 className="section-title">
            {t("admin.adventure.sheetTitle", { name: detail?.character.username ?? selected })}
          </h2>
          {detail ? (
            <>
              <PlayerSheet detail={detail} catalogue={catalogue} />
              <InterventionForm
                catalogue={catalogue}
                pending={pending}
                onSubmit={applyIntervention}
              />
            </>
          ) : (
            <p className="text-muted">{t("admin.adventure.sheetLoading")}</p>
          )}
        </>
      )}
    </div>
  );
}
