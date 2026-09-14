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
import { api } from "@/lib/api";
import type { BlindtestPreset, GuildSettings, LoopMode } from "@/lib/types";
import { useEditableResource } from "@/lib/useEditableResource";
import { useGuildResources } from "@/lib/useGuildResources";

const LOOP_LABELS: Record<LoopMode, string> = {
  NONE: "Désactivée",
  TRACK: "Titre en cours",
  QUEUE: "File d'attente",
};

export default function MusicSettingsPage() {
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
    return <div className="empty-state">Impossible de charger les réglages musique.</div>;
  }
  if (!resources || !editor.draft) {
    return <p className="text-muted">Chargement…</p>;
  }

  const { draft, update } = editor;
  const channelOptions = resources.channels.map((channel) => ({
    id: channel.id,
    label: `#${channel.name}`,
  }));

  return (
    <div className="settings-page">
      <SettingsSection
        title="Accès"
        description="Les membres ayant la permission « Administrateur » ne sont jamais concernés par ces restrictions."
      >
        <SettingRow
          label="Salon des commandes musique"
          hint="Les commandes musique ne fonctionnent que dans ce salon, pour tous les membres sauf les administrateurs."
        >
          <ChannelSelect
            value={draft.musicChannelId}
            channels={resources.channels}
            emptyLabel="Tous les salons"
            ariaLabel="Salon des commandes musique"
            onChange={(musicChannelId) => update({ musicChannelId })}
          />
        </SettingRow>
        <SettingRow
          label="Rôle DJ"
          hint="Sans ce rôle, un membre peut écouter et ajouter des titres, mais pas passer, arrêter, ni régler la lecture. Les membres ayant la permission « Gérer le serveur » n'en ont pas besoin."
        >
          <RoleSelect
            value={draft.djRoleId}
            roles={resources.roles}
            emptyLabel="Aucun (tout le monde)"
            ariaLabel="Rôle DJ"
            onChange={(djRoleId) => update({ djRoleId })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Lecture" description="Appliqué quand Gaulia rejoint un salon vocal.">
        <SettingRow label="Volume par défaut">
          <span className="range-field">
            <input
              type="range"
              className="range"
              min={0}
              max={150}
              step={5}
              value={draft.musicVolume}
              aria-label="Volume par défaut"
              onChange={(event) => update({ musicVolume: Number(event.target.value) })}
            />
            <span className="numeric">{draft.musicVolume} %</span>
          </span>
        </SettingRow>
        <SettingRow label="Répétition par défaut">
          <select
            className="select"
            aria-label="Répétition par défaut"
            value={draft.musicDefaultLoop}
            onChange={(event) => update({ musicDefaultLoop: event.target.value as LoopMode })}
          >
            {(Object.keys(LOOP_LABELS) as LoopMode[]).map((mode) => (
              <option key={mode} value={mode}>
                {LOOP_LABELS[mode]}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow
          label={
            <>Mode 24/7 {!draft.premium && <span className="badge badge-muted">Premium</span>}</>
          }
          hint={
            draft.premium
              ? "Gaulia reste connecté en vocal même quand la file d'attente est vide."
              : "Nécessite Gaulia Premium sur ce serveur."
          }
        >
          <Toggle
            checked={draft.musicStay247}
            ariaLabel="Mode 24/7"
            onChange={(musicStay247) => {
              if (draft.premium || !musicStay247) update({ musicStay247 });
            }}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="Blindtest"
        description="Réglages de la commande /blindtest. Les administrateurs ne sont jamais concernés par la restriction de salons."
      >
        <SettingRow
          label="Salons du blindtest"
          hint="Le blindtest ne peut être lancé que dans ces salons et leurs fils, indépendamment du salon des commandes musique. Sans salon choisi, il est utilisable partout."
        >
          <MultiPicker
            values={draft.blindtestChannelIds}
            options={channelOptions}
            addLabel="Ajouter un salon…"
            emptyLabel="Tous les salons"
            ariaLabel="Ajouter un salon de blindtest"
            onChange={(blindtestChannelIds) => update({ blindtestChannelIds })}
          />
        </SettingRow>
        <div className="setting-row setting-row-stacked">
          <div className="setting-row-text">
            <strong>Catégories proposées</strong>
            <span className="setting-hint">
              Une catégorie désactivée n&apos;apparaît plus dans l&apos;autocomplétion de /blindtest
              sur ce serveur.
            </span>
          </div>
          {presetsFailed && (
            <p className="notice notice-error">Impossible de charger les catégories.</p>
          )}
          {!presetsFailed && !presets && <p className="text-muted">Chargement…</p>}
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
