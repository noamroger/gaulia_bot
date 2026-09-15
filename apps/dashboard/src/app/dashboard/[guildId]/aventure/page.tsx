"use client";

import { useParams } from "next/navigation";

import { Toggle } from "@/components/Toggle";
import { MultiPicker } from "@/components/settings/MultiPicker";
import { SaveBar } from "@/components/settings/SaveBar";
import { SettingRow, SettingsSection } from "@/components/settings/SettingsSection";
import type { AdventureChannelMode, GuildSettings } from "@/lib/types";
import { useEditableResource } from "@/lib/useEditableResource";
import { useGuildResources } from "@/lib/useGuildResources";

const MODE_LABELS: Record<AdventureChannelMode, string> = {
  ALLOWLIST: "Liste blanche — jouable uniquement dans les salons choisis",
  BLOCKLIST: "Liste noire — jouable partout, sauf dans les salons choisis",
};

export default function AdventureSettingsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { resources, failed } = useGuildResources(guildId);
  const editor = useEditableResource<GuildSettings>(`/guilds/${guildId}/settings`);

  if (failed || editor.loadFailed) {
    return (
      <div className="empty-state">Impossible de charger les réglages de l&apos;aventure.</div>
    );
  }
  if (!resources || !editor.draft) {
    return <p className="text-muted">Chargement…</p>;
  }

  const { draft, update } = editor;
  const channelOptions = resources.channels.map((channel) => ({
    id: channel.id,
    label: `#${channel.name}`,
  }));

  const allowlist = draft.adventureChannelMode === "ALLOWLIST";
  const noChannels = draft.adventureChannelIds.length === 0;

  // Résumé en une phrase de ce que le réglage courant autorise réellement, pour qu'il n'y ait
  // aucun doute sur l'effet de la combinaison mode + liste.
  const summary = !draft.adventureEnabled
    ? "Le module est désactivé : l'aventure n'est jouable dans aucun salon de ce serveur."
    : allowlist
      ? noChannels
        ? "Aucun salon autorisé : l'aventure n'est jouable dans aucun salon de ce serveur."
        : `L'aventure est jouable dans ${draft.adventureChannelIds.length} salon(s) et leurs fils, nulle part ailleurs.`
      : noChannels
        ? "L'aventure est jouable dans tous les salons du serveur."
        : `L'aventure est jouable partout, sauf dans ${draft.adventureChannelIds.length} salon(s) et leurs fils.`;

  return (
    <div className="settings-page">
      <SettingsSection
        title="Où l'aventure se joue"
        description="Les membres peuvent toujours jouer en message privé avec Gaulia : ce réglage ne concerne que les salons de ce serveur. Il s'applique à tout le monde, administrateurs compris."
      >
        <SettingRow
          label="Module aventure"
          hint="Désactivé, /aventure ne répond plus dans aucun salon du serveur."
        >
          <Toggle
            checked={draft.adventureEnabled}
            onChange={(adventureEnabled) => update({ adventureEnabled })}
          />
        </SettingRow>

        <SettingRow
          label="Mode des salons"
          hint="Par défaut, la liste blanche est vide : l'aventure est donc interdite partout tant qu'aucun salon n'a été autorisé."
        >
          <select
            className="select"
            aria-label="Mode des salons d'aventure"
            value={draft.adventureChannelMode}
            onChange={(event) =>
              update({ adventureChannelMode: event.target.value as AdventureChannelMode })
            }
          >
            {(Object.keys(MODE_LABELS) as AdventureChannelMode[]).map((mode) => (
              <option key={mode} value={mode}>
                {MODE_LABELS[mode]}
              </option>
            ))}
          </select>
        </SettingRow>

        <SettingRow
          label={allowlist ? "Salons autorisés" : "Salons interdits"}
          hint={
            allowlist
              ? "Seuls ces salons (et leurs fils) acceptent les commandes d'aventure."
              : "Ces salons (et leurs fils) refusent les commandes d'aventure ; tous les autres les acceptent."
          }
        >
          <MultiPicker
            values={draft.adventureChannelIds}
            options={channelOptions}
            addLabel="Ajouter un salon…"
            emptyLabel={
              allowlist
                ? "Aucun salon — aventure interdite partout"
                : "Aucun salon — aventure autorisée partout"
            }
            ariaLabel="Ajouter un salon d'aventure"
            onChange={(adventureChannelIds) => update({ adventureChannelIds })}
          />
        </SettingRow>

        <SettingRow label="Résultat">
          <span className="setting-hint">{summary}</span>
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="À propos du module"
        description="L'aventure est un jeu de rôle au long cours : chaque membre a un aventurier unique, partagé entre tous les serveurs et les messages privés."
      >
        <SettingRow
          label="Progression"
          hint="L'énergie limite le nombre d'explorations par jour et les fragments d'écho — gagnés avec les quêtes et le donjon hebdomadaire — font avancer le scénario. Terminer l'histoire demande plus d'un an de jeu régulier."
        >
          <span className="setting-hint">7 actes · 35 chapitres</span>
        </SettingRow>
        <SettingRow
          label="Commandes"
          hint="Tout passe par /aventure : tuto, commencer, explorer, histoire, quetes, inventaire, boutique, forge, renforcer, echanger, donjon, classement… Les nouveaux venus peuvent lancer /aventure tuto sans avoir de personnage."
        >
          <span className="setting-hint">Une seule commande</span>
        </SettingRow>
        <SettingRow
          label="Échanges entre joueurs"
          hint="Les aventuriers peuvent s'échanger objets et pièces à partir du niveau 5. Les reliques du scénario ne s'échangent pas, et le renforcement d'un équipement reste attaché à celui qui l'a payé. Les propositions suivent les mêmes règles de salons que le reste du module."
        >
          <span className="setting-hint">Objets et pièces</span>
        </SettingRow>
      </SettingsSection>

      <SaveBar editor={editor} />
    </div>
  );
}
