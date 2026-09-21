"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { SaveBar } from "@/components/settings/SaveBar";
import { SettingRow, SettingsSection } from "@/components/settings/SettingsSection";
import { useLocale, useTranslation, type Translator } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import {
  BLINDTEST_PLAYLIST_MAX_TRACKS,
  BLINDTEST_PLAYLIST_MIN_TRACKS,
  BLINDTEST_PLAYLIST_NAME_MAX,
  blindtestTrackKey,
} from "@/lib/blindtest";
import { formatNumber } from "@/lib/format";
import type { BlindtestPlaylist, BlindtestTrack, SpotifyImport } from "@/lib/types";
import { useEditableResource } from "@/lib/useEditableResource";

/** Above this many tracks the list gets a search field. */
const FILTER_THRESHOLD = 10;

interface Notice {
  kind: "success" | "error";
  text: string;
}

function errorMessage(error: unknown, t: Translator): string {
  return error instanceof ApiError && error.status < 500 && !error.generic
    ? error.message
    : t("common.state.error");
}

export default function BlindtestPlaylistPage() {
  const t = useTranslation();
  const locale = useLocale();
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
      {t("music.playlist.back")}
    </Link>
  );

  if (editor.loadFailed) {
    return (
      <div>
        {backLink}
        <div className="empty-state">{t("music.playlist.loadError")}</div>
      </div>
    );
  }
  if (!editor.draft) {
    return <p className="text-muted">{t("common.state.loading")}</p>;
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
      const parts = [t("music.playlist.imported", { count: added, name: result.name })];
      if (duplicates > 0) parts.push(t("music.playlist.duplicates", { count: duplicates }));
      if (overflow > 0) {
        parts.push(
          t("music.playlist.overflow", {
            count: overflow,
            max: BLINDTEST_PLAYLIST_MAX_TRACKS,
          }),
        );
      }
      setNotice({
        kind: added > 0 ? "success" : "error",
        text: `${parts.join(" · ")}. ${t("music.playlist.remember")}`,
      });
      setLink("");
    } catch (importError) {
      setNotice({ kind: "error", text: errorMessage(importError, t) });
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
            ? t("music.playlist.duplicateTrack")
            : t("music.playlist.full", { max: BLINDTEST_PLAYLIST_MAX_TRACKS }),
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

      <SettingsSection title={t("music.playlist.title")}>
        <SettingRow label={t("music.playlist.name.label")} hint={t("music.playlist.name.hint")}>
          <input
            type="text"
            className="input"
            aria-label={t("music.playlist.name.aria")}
            maxLength={BLINDTEST_PLAYLIST_NAME_MAX}
            value={draft.name}
            onChange={(event) => update({ name: event.target.value })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title={t("music.playlist.add.title")}
        description={t("music.playlist.add.description")}
      >
        <form className="inline-form" onSubmit={(event) => void importLink(event)}>
          <input
            type="url"
            className="input input-grow"
            placeholder={t("music.playlist.add.linkPlaceholder")}
            aria-label={t("music.playlist.add.linkAria")}
            value={link}
            disabled={importing || full}
            onChange={(event) => setLink(event.target.value)}
          />
          <button
            type="submit"
            className="button-primary"
            disabled={importing || full || !link.trim()}
          >
            {importing ? t("music.playlist.add.importing") : t("music.playlist.add.import")}
          </button>
        </form>

        <form className="inline-form" onSubmit={addManual}>
          <input
            type="text"
            className="input input-grow"
            placeholder={t("music.playlist.add.titlePlaceholder")}
            aria-label={t("music.playlist.add.titleAria")}
            maxLength={200}
            value={manualTitle}
            disabled={full}
            onChange={(event) => setManualTitle(event.target.value)}
          />
          <input
            type="text"
            className="input input-grow"
            placeholder={t("music.playlist.add.artistPlaceholder")}
            aria-label={t("music.playlist.add.artistAria")}
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
            {t("music.playlist.add.submit")}
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
        title={t("music.playlist.tracks.title", {
          value: formatNumber(tracks.length, locale),
          max: BLINDTEST_PLAYLIST_MAX_TRACKS,
        })}
        description={
          tracks.length < BLINDTEST_PLAYLIST_MIN_TRACKS
            ? t("music.playlist.tracks.minimum", { count: BLINDTEST_PLAYLIST_MIN_TRACKS })
            : undefined
        }
      >
        {tracks.length > FILTER_THRESHOLD && (
          <input
            type="search"
            className="search-input track-filter"
            placeholder={t("music.playlist.tracks.filterPlaceholder")}
            aria-label={t("music.playlist.tracks.filterAria")}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        )}

        {tracks.length === 0 ? (
          <p className="setting-hint">{t("music.playlist.tracks.empty")}</p>
        ) : visible.length === 0 ? (
          <p className="setting-hint">{t("music.playlist.tracks.noMatch")}</p>
        ) : (
          <div className="table-scroll">
            <table className="table track-table">
              <thead>
                <tr>
                  <th className="numeric">#</th>
                  <th>{t("music.playlist.tracks.columnTitle")}</th>
                  <th>{t("music.playlist.tracks.columnArtist")}</th>
                  <th>{t("music.playlist.tracks.columnPreview")}</th>
                  <th>
                    <span className="visually-hidden">
                      {t("music.playlist.tracks.columnActions")}
                    </span>
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
                        aria-label={t("music.playlist.tracks.removeAria", { title: track.title })}
                        onClick={() => removeTrack(index)}
                      >
                        {t("music.playlist.tracks.remove")}
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
        invalidReason={draft.name.trim() ? null : t("music.playlist.name.required")}
      />
    </div>
  );
}
