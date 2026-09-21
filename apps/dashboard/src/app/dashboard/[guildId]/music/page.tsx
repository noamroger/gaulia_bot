"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Toggle } from "@/components/Toggle";
import { BlindtestPlaylistManager } from "@/components/blindtest/BlindtestPlaylistManager";
import { PresetCategoryToggles } from "@/components/blindtest/PresetCategoryToggles";
import { ChannelSelect } from "@/components/settings/ChannelSelect";
import { MultiPicker } from "@/components/settings/MultiPicker";
import { RoleSelect } from "@/components/settings/RoleSelect";
import { SaveBar } from "@/components/settings/SaveBar";
import { SettingRow, SettingsSection } from "@/components/settings/SettingsSection";
import { useLocale, useTranslation } from "@/i18n";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { BlindtestPreset, GuildSettings, LoopMode } from "@/lib/types";
import { useEditableResource } from "@/lib/useEditableResource";
import { useGuildResources } from "@/lib/useGuildResources";

const LOOP_MODES: readonly LoopMode[] = ["NONE", "TRACK", "QUEUE"];

export default function MusicSettingsPage() {
  const t = useTranslation();
  const locale = useLocale();
  const { guildId } = useParams<{ guildId: string }>();
  const { resources, failed } = useGuildResources(guildId);
  const editor = useEditableResource<GuildSettings>(`/guilds/${guildId}/settings`);
  const [presets, setPresets] = useState<BlindtestPreset[] | null>(null);
  const [presetsFailed, setPresetsFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<BlindtestPreset[]>("/blindtest/presets")
      .then((value) => {
        if (!cancelled) setPresets(value);
      })
      .catch(() => {
        if (!cancelled) setPresetsFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed || editor.loadFailed) {
    return <div className="empty-state">{t("music.loadError")}</div>;
  }
  if (!resources || !editor.draft) {
    return <p className="text-muted">{t("common.state.loading")}</p>;
  }

  const { draft, update } = editor;
  const channelOptions = resources.channels.map((channel) => ({
    id: channel.id,
    label: `#${channel.name}`,
  }));

  return (
    <div className="settings-page">
      <SettingsSection title={t("music.access.title")} description={t("music.access.description")}>
        <SettingRow label={t("music.access.channel.label")} hint={t("music.access.channel.hint")}>
          <ChannelSelect
            value={draft.musicChannelId}
            channels={resources.channels}
            emptyLabel={t("music.access.channel.any")}
            ariaLabel={t("music.access.channel.aria")}
            onChange={(musicChannelId) => update({ musicChannelId })}
          />
        </SettingRow>
        <SettingRow label={t("music.access.dj.label")} hint={t("music.access.dj.hint")}>
          <RoleSelect
            value={draft.djRoleId}
            roles={resources.roles}
            emptyLabel={t("music.access.dj.none")}
            ariaLabel={t("music.access.dj.aria")}
            onChange={(djRoleId) => update({ djRoleId })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title={t("music.playback.title")}
        description={t("music.playback.description")}
      >
        <SettingRow label={t("music.playback.volume.label")}>
          <span className="range-field">
            <input
              type="range"
              className="range"
              min={0}
              max={150}
              step={5}
              value={draft.musicVolume}
              aria-label={t("music.playback.volume.aria")}
              onChange={(event) => update({ musicVolume: Number(event.target.value) })}
            />
            <span className="numeric">
              {t("music.playback.volume.value", { value: formatNumber(draft.musicVolume, locale) })}
            </span>
          </span>
        </SettingRow>
        <SettingRow label={t("music.playback.loop.label")}>
          <select
            className="select"
            aria-label={t("music.playback.loop.aria")}
            value={draft.musicDefaultLoop}
            onChange={(event) => update({ musicDefaultLoop: event.target.value as LoopMode })}
          >
            {LOOP_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(`music.loopMode.${mode}`)}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow
          label={
            <>
              {t("music.playback.stay247.label")}{" "}
              {!draft.premium && (
                <span className="badge badge-muted">{t("music.playback.stay247.badge")}</span>
              )}
            </>
          }
          hint={
            draft.premium ? t("music.playback.stay247.hint") : t("music.playback.stay247.locked")
          }
        >
          <Toggle
            checked={draft.musicStay247}
            ariaLabel={t("music.playback.stay247.aria")}
            onChange={(musicStay247) => {
              if (draft.premium || !musicStay247) update({ musicStay247 });
            }}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title={t("music.blindtest.title")}
        description={t("music.blindtest.description")}
      >
        <SettingRow
          label={t("music.blindtest.channels.label")}
          hint={t("music.blindtest.channels.hint")}
        >
          <MultiPicker
            values={draft.blindtestChannelIds}
            options={channelOptions}
            addLabel={t("music.blindtest.channels.add")}
            emptyLabel={t("music.blindtest.channels.empty")}
            ariaLabel={t("music.blindtest.channels.aria")}
            onChange={(blindtestChannelIds) => update({ blindtestChannelIds })}
          />
        </SettingRow>
        <div className="setting-row setting-row-stacked">
          <div className="setting-row-text">
            <strong>{t("music.blindtest.categories.label")}</strong>
            <span className="setting-hint">{t("music.blindtest.categories.hint")}</span>
          </div>
          {presetsFailed && (
            <p className="notice notice-error">{t("music.blindtest.categories.loadError")}</p>
          )}
          {!presetsFailed && !presets && <p className="text-muted">{t("common.state.loading")}</p>}
          {presets && (
            <PresetCategoryToggles
              presets={presets}
              disabled={draft.blindtestDisabledCategories}
              onChange={(blindtestDisabledCategories) => update({ blindtestDisabledCategories })}
            />
          )}
        </div>
      </SettingsSection>

      <BlindtestPlaylistManager guildId={guildId} />

      <SaveBar editor={editor} />
    </div>
  );
}
