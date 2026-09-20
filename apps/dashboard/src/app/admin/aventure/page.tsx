"use client";

import { useEffect, useMemo, useState } from "react";

import { InterventionForm } from "@/components/adventure/InterventionForm";
import { PlayerSheet } from "@/components/adventure/PlayerSheet";
import { api, ApiError } from "@/lib/api";
import { userAvatarUrl } from "@/lib/discordCdn";
import { formatDateTime, formatNumber } from "@/lib/format";
import type {
  AdventureCatalogue,
  AdventureIntervention,
  AdventurePlayer,
  AdventurePlayerDetail,
} from "@/lib/types";

const CLASS_EMOJIS: Record<string, string> = {
  GUERRIER: "🛡️",
  MAGE: "🔮",
  RODEUR: "🏹",
};

function errorMessage(error: unknown): string {
  return error instanceof ApiError && error.status < 500
    ? error.message
    : "Une erreur interne est survenue.";
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
        if (!cancelled) setError(errorMessage(loadError));
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

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
      setSuccess("Intervention appliquée et inscrite dans le journal du joueur.");
    } catch (patchError) {
      setError(errorMessage(patchError));
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
          <span className="stat-label">Aventuriers</span>
          <span className="stat-value">{formatNumber(totalPlayers)}</span>
          <span className="stat-hint">personnages créés</span>
        </div>
        <div className="card stat-tile">
          <span className="stat-label">Histoires terminées</span>
          <span className="stat-value">{formatNumber(finished)}</span>
          <span className="stat-hint">sur {catalogue?.totalChapters ?? "-"} chapitres</span>
        </div>
        <div className="card stat-tile">
          <span className="stat-label">Niveau le plus élevé</span>
          <span className="stat-value">
            {formatNumber(Math.max(0, ...(players ?? []).map((player) => player.level)))}
          </span>
          <span className="stat-hint">maximum : {catalogue?.maxLevel ?? "-"}</span>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Chercher un joueur (pseudo ou identifiant)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {error && <p className="notice notice-error">{error}</p>}
      {success && <p className="notice notice-success">{success}</p>}

      {filtered === null ? (
        <p className="text-muted">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Aucun aventurier pour l&apos;instant.</div>
      ) : (
        <div className="card table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Joueur</th>
                <th className="numeric">Niveau</th>
                <th>Scénario</th>
                <th className="numeric">Pièces</th>
                <th className="numeric">Fragments</th>
                <th>Dernière partie</th>
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
                      ? "Terminé"
                      : `Acte ${player.actIndex + 1} · chapitre ${player.chapterIndex + 1}`}
                  </td>
                  <td className="numeric">{formatNumber(player.gold)}</td>
                  <td className="numeric">{formatNumber(player.echoes)}</td>
                  <td>{player.lastPlayedAt ? formatDateTime(player.lastPlayedAt) : "-"}</td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="button-secondary button-small"
                      onClick={() =>
                        setSelected((current) => (current === player.userId ? null : player.userId))
                      }
                    >
                      {selected === player.userId ? "Fermer" : "Ouvrir"}
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
          <h2 className="section-title">Partie de {detail?.character.username ?? selected}</h2>
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
            <p className="text-muted">Chargement de la fiche…</p>
          )}
        </>
      )}
    </div>
  );
}
