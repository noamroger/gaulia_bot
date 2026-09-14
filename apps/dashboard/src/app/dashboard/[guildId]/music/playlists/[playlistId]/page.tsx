"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { SaveBar } from "@/components/settings/SaveBar";
import { SettingRow, SettingsSection } from "@/components/settings/SettingsSection";
import { api, ApiError } from "@/lib/api";
import {
  BLINDTEST_PLAYLIST_MAX_TRACKS,
  BLINDTEST_PLAYLIST_MIN_TRACKS,
  BLINDTEST_PLAYLIST_NAME_MAX,
  blindtestTrackKey,
} from "@/lib/blindtest";
import type { BlindtestPlaylist, BlindtestTrack, SpotifyImport } from "@/lib/types";
import { useEditableResource } from "@/lib/useEditableResource";

const FILTER_THRESHOLD = 10;

interface Notice {
  kind: "success" | "error";
  text: string;
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError && error.status < 500
    ? error.message
    : "Une erreur interne est survenue.";
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

export default function BlindtestPlaylistPage() {
  const { guildId, playlistId } = useParams<{ guildId: string; playlistId: string }>();
  const editor = useEditableResource<BlindtestPlaylist>(
    `/guilds/${guildId}/blindtest/playlists/${playlistId}`,
  );
  const [link, setLink] = useState("");
  const [importing, setImporting] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualArtist, setManualArtist] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [filter, setFilter] = useState("");

  const backLink = (
    <Link href={`/dashboard/${guildId}/music`} className="back-link">
      Retour aux réglages musique
    </Link>
  );

  if (editor.loadFailed) {
    return (
      <div>
        {backLink}
        <div className="empty-state">Impossible de charger cette liste.</div>
      </div>
    );
  }
  if (!editor.draft) {
    return <p className="text-muted">Chargement…</p>;
  }

  const { draft, update } = editor;
  const tracks = draft.tracks;

  function addTracks(incoming: BlindtestTrack[]): {
    added: number;
    duplicates: number;
    overflow: number;
  } {
    const known = new Set(tracks.map(blindtestTrackKey));
    const fresh: BlindtestTrack[] = [];
    let duplicates = 0;
    for (const track of incoming) {
      const key = blindtestTrackKey(track);
      if (known.has(key)) {
        duplicates++;
        continue;
      }
      known.add(key);
      fresh.push(track);
    }
    const accepted = fresh.slice(0, Math.max(0, BLINDTEST_PLAYLIST_MAX_TRACKS - tracks.length));
    if (accepted.length > 0) {
      const next = [...tracks, ...accepted];
      update({ tracks: next, trackCount: next.length });
    }
    return { added: accepted.length, duplicates, overflow: fresh.length - accepted.length };
  }

  async function importLink(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!link.trim()) return;
    setImporting(true);
    setNotice(null);
    try {
      const result = await api.post<SpotifyImport>(`/guilds/${guildId}/blindtest/spotify-import`, {
        url: link.trim(),
      });
      const { added, duplicates, overflow } = addTracks(result.tracks);
      const details = [
        duplicates > 0 ? `${plural(duplicates, "déjà présent", "déjà présents")}` : null,
        overflow > 0
          ? `${plural(overflow, "ignoré", "ignorés")} (limite de ${BLINDTEST_PLAYLIST_MAX_TRACKS} titres)`
          : null,
      ].filter(Boolean);
      setNotice({
        kind: added > 0 ? "success" : "error",
        text: `${plural(added, "titre ajouté", "titres ajoutés")} depuis « ${result.name} »${
          details.length > 0 ? ` · ${details.join(" · ")}` : ""
        }. Pense à enregistrer.`,
      });
      setLink("");
    } catch (importError) {
      setNotice({ kind: "error", text: errorMessage(importError) });
    } finally {
      setImporting(false);
    }
  }

  function addManual(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const title = manualTitle.trim();
    const artist = manualArtist.trim();
    if (!title || !artist) return;
    const { added, duplicates } = addTracks([
      { uri: null, title, artist, durationMs: 0, preview: null },
    ]);
    if (added > 0) {
      setManualTitle("");
      setManualArtist("");
      setNotice(null);
    } else {
      setNotice({
        kind: "error",
        text:
          duplicates > 0
            ? "Ce titre est déjà dans la liste."
            : `La liste est limitée à ${BLINDTEST_PLAYLIST_MAX_TRACKS} titres.`,
      });
    }
  }

  function removeTrack(index: number): void {
    const next = tracks.filter((_, position) => position !== index);
    update({ tracks: next, trackCount: next.length });
  }

  const query = filter.trim().toLowerCase();
  const visible = tracks
    .map((track, index) => ({ track, index }))
    .filter(
      ({ track }) =>
        !query ||
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query),
    );
  const full = tracks.length >= BLINDTEST_PLAYLIST_MAX_TRACKS;

  return (
    <div className="settings-page">
      {backLink}

      <SettingsSection title="Liste personnalisée">
        <SettingRow label="Nom" hint="Affiché dans l'autocomplétion de /blindtest.">
          <input
            type="text"
            className="input"
            aria-label="Nom de la liste"
            maxLength={BLINDTEST_PLAYLIST_NAME_MAX}
            value={draft.name}
            onChange={(event) => update({ name: event.target.value })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="Ajouter des titres"
        description="Colle le lien d'une playlist, d'un album ou d'un titre Spotify public (les 100 premiers titres d'une playlist sont lus). Un titre ajouté à la main sera cherché sur SoundCloud pendant la partie."
      >
        <form className="inline-form" onSubmit={(event) => void importLink(event)}>
          <input
            type="url"
            className="input input-grow"
            placeholder="https://open.spotify.com/playlist/…"
            aria-label="Lien Spotify à importer"
            value={link}
            disabled={importing || full}
            onChange={(event) => setLink(event.target.value)}
          />
          <button
            type="submit"
            className="button-primary"
            disabled={importing || full || !link.trim()}
          >
            {importing ? "Import…" : "Importer"}
          </button>
        </form>

        <form className="inline-form" onSubmit={addManual}>
          <input
            type="text"
            className="input input-grow"
            placeholder="Titre"
            aria-label="Titre à ajouter"
            maxLength={200}
            value={manualTitle}
            disabled={full}
            onChange={(event) => setManualTitle(event.target.value)}
          />
          <input
            type="text"
            className="input input-grow"
            placeholder="Artiste"
            aria-label="Artiste du titre à ajouter"
            maxLength={300}
            value={manualArtist}
            disabled={full}
            onChange={(event) => setManualArtist(event.target.value)}
          />
          <button
            type="submit"
            className="button-secondary"
            disabled={full || !manualTitle.trim() || !manualArtist.trim()}
          >
            Ajouter
          </button>
        </form>

        {notice && (
          <p
            className={`notice ${notice.kind === "success" ? "notice-success" : "notice-error"}`}
            role={notice.kind === "error" ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}
      </SettingsSection>

      <SettingsSection
        title={`Titres (${tracks.length} / ${BLINDTEST_PLAYLIST_MAX_TRACKS})`}
        description={
          tracks.length < BLINDTEST_PLAYLIST_MIN_TRACKS
            ? `Il faut au moins ${BLINDTEST_PLAYLIST_MIN_TRACKS} titres pour lancer un blindtest avec cette liste.`
            : undefined
        }
      >
        {tracks.length > FILTER_THRESHOLD && (
          <input
            type="search"
            className="search-input track-filter"
            placeholder="Filtrer par titre ou artiste"
            aria-label="Filtrer les titres"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        )}

        {tracks.length === 0 ? (
          <p className="setting-hint">Aucun titre pour le moment.</p>
        ) : visible.length === 0 ? (
          <p className="setting-hint">Aucun titre ne correspond à ce filtre.</p>
        ) : (
          <div className="table-scroll">
            <table className="table track-table">
              <thead>
                <tr>
                  <th className="numeric">#</th>
                  <th>Titre</th>
                  <th>Artiste</th>
                  <th>Extrait</th>
                  <th>
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ track, index }) => (
                  <tr key={`${blindtestTrackKey(track)}-${index}`}>
                    <td className="numeric text-muted">{index + 1}</td>
                    <td>{track.title}</td>
                    <td className="text-muted">{track.artist}</td>
                    <td>
                      <span className={`badge ${track.preview ? "badge-success" : "badge-muted"}`}>
                        {track.preview ? "Spotify" : "SoundCloud"}
                      </span>
                    </td>
                    <td className="track-actions">
                      <button
                        type="button"
                        className="button-secondary button-small"
                        aria-label={`Retirer ${track.title}`}
                        onClick={() => removeTrack(index)}
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsSection>

      <SaveBar
        editor={editor}
        invalidReason={draft.name.trim() ? null : "Donne un nom à la liste."}
      />
    </div>
  );
}
