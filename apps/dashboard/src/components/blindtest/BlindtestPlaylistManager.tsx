"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { SettingsSection } from "@/components/settings/SettingsSection";
import { api, ApiError } from "@/lib/api";
import { BLINDTEST_MAX_PLAYLISTS, BLINDTEST_PLAYLIST_NAME_MAX } from "@/lib/blindtest";
import type { BlindtestPlaylist, BlindtestPlaylistSummary } from "@/lib/types";

function errorMessage(error: unknown): string {
  return error instanceof ApiError && error.status < 500
    ? error.message
    : "Une erreur interne est survenue.";
}

/** Listes personnalisées du serveur : création et suppression enregistrées immédiatement. */
export function BlindtestPlaylistManager({ guildId }: { guildId: string }) {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<BlindtestPlaylistSummary[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<BlindtestPlaylistSummary[]>(`/guilds/${guildId}/blindtest/playlists`)
      .then((value) => {
        if (!cancelled) setPlaylists(value);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  async function create(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    setError(null);
    try {
      const created = await api.post<BlindtestPlaylist>(`/guilds/${guildId}/blindtest/playlists`, {
        name: trimmed,
      });
      router.push(`/dashboard/${guildId}/music/playlists/${created.id}`);
    } catch (createError) {
      setError(errorMessage(createError));
      setCreating(false);
    }
  }

  async function remove(id: string): Promise<void> {
    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`/guilds/${guildId}/blindtest/playlists/${id}`);
      setPlaylists((current) => current?.filter((playlist) => playlist.id !== id) ?? current);
      setConfirmingId(null);
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setDeletingId(null);
    }
  }

  const limitReached = (playlists?.length ?? 0) >= BLINDTEST_MAX_PLAYLISTS;

  return (
    <SettingsSection
      title="Listes personnalisées"
      description="Crée tes propres listes de musiques : elles sont proposées dans l'autocomplétion de /blindtest, en plus des catégories activées. La création et la suppression sont enregistrées immédiatement."
    >
      {loadFailed && <p className="notice notice-error">Impossible de charger les listes.</p>}
      {!loadFailed && !playlists && <p className="text-muted">Chargement…</p>}

      {playlists && (
        <>
          {playlists.length === 0 ? (
            <p className="setting-hint">Aucune liste pour le moment.</p>
          ) : (
            <ul className="playlist-list">
              {playlists.map((playlist) => (
                <li key={playlist.id} className="playlist-row">
                  <span className="playlist-row-name">
                    <Link href={`/dashboard/${guildId}/music/playlists/${playlist.id}`}>
                      {playlist.name}
                    </Link>
                    <span className="setting-hint">{playlist.trackCount} titres</span>
                  </span>
                  <span className="playlist-row-actions">
                    {confirmingId === playlist.id ? (
                      <>
                        <button
                          type="button"
                          className="button-danger button-small"
                          disabled={deletingId === playlist.id}
                          onClick={() => void remove(playlist.id)}
                        >
                          {deletingId === playlist.id ? "Suppression…" : "Confirmer"}
                        </button>
                        <button
                          type="button"
                          className="button-secondary button-small"
                          disabled={deletingId === playlist.id}
                          onClick={() => setConfirmingId(null)}
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/dashboard/${guildId}/music/playlists/${playlist.id}`}
                          className="button-secondary button-small"
                        >
                          Modifier
                        </Link>
                        <button
                          type="button"
                          className="button-secondary button-small"
                          onClick={() => setConfirmingId(playlist.id)}
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <form className="inline-form" onSubmit={(event) => void create(event)}>
            <input
              type="text"
              className="input input-grow"
              placeholder="Nom de la nouvelle liste"
              aria-label="Nom de la nouvelle liste"
              maxLength={BLINDTEST_PLAYLIST_NAME_MAX}
              value={name}
              disabled={creating || limitReached}
              onChange={(event) => setName(event.target.value)}
            />
            <button
              type="submit"
              className="button-primary"
              disabled={creating || limitReached || !name.trim()}
            >
              {creating ? "Création…" : "Créer la liste"}
            </button>
          </form>
          {limitReached && (
            <p className="field-hint inline-hint">
              Limite de {BLINDTEST_MAX_PLAYLISTS} listes atteinte : supprimes-en une pour en créer
              une nouvelle.
            </p>
          )}
        </>
      )}

      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
    </SettingsSection>
  );
}
