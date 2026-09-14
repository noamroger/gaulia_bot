"use client";

import { useParams } from "next/navigation";

import { Toggle } from "@/components/Toggle";
import { ChannelSelect } from "@/components/settings/ChannelSelect";
import { EscalationEditor, escalationError } from "@/components/settings/EscalationEditor";
import { SaveBar } from "@/components/settings/SaveBar";
import { SettingRow, SettingsSection } from "@/components/settings/SettingsSection";
import type { GuildSettings } from "@/lib/types";
import { useEditableResource } from "@/lib/useEditableResource";
import { useGuildResources } from "@/lib/useGuildResources";

export default function GuildSettingsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { resources, failed } = useGuildResources(guildId);
  const editor = useEditableResource<GuildSettings>(`/guilds/${guildId}/settings`);

  if (failed || editor.loadFailed) {
    return <div className="empty-state">Impossible de charger les paramètres de ce serveur.</div>;
  }
  if (!resources || !editor.draft) {
    return <p className="text-muted">Chargement…</p>;
  }

  const { draft, update } = editor;

  return (
    <div className="settings-page">
      <SettingsSection
        title="Salons de logs"
        description="Où Gaulia publie ses rapports. Choisis « Désactivé » pour ne rien publier."
      >
        <SettingRow
          label="Logs de modération"
          hint="Chaque sanction (bannissement, expulsion, sourdine, avertissement…) avec sa raison et son auteur."
        >
          <ChannelSelect
            value={draft.modLogChannelId}
            channels={resources.channels}
            emptyLabel="Désactivé"
            ariaLabel="Salon des logs de modération"
            onChange={(modLogChannelId) => update({ modLogChannelId })}
          />
        </SettingRow>
        <SettingRow
          label="Logs automod"
          hint="Messages supprimés par l'automod et sanctions appliquées."
        >
          <ChannelSelect
            value={draft.automodLogChannelId}
            channels={resources.channels}
            emptyLabel="Désactivé"
            ariaLabel="Salon des logs automod"
            onChange={(automodLogChannelId) => update({ automodLogChannelId })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Sanctions">
        <SettingRow
          label="Prévenir le membre en message privé"
          hint="Le membre sanctionné reçoit l'action et sa raison en MP (si ses MP sont ouverts)."
        >
          <Toggle
            checked={draft.dmOnSanction}
            onChange={(dmOnSanction) => update({ dmOnSanction })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="Sanctions automatiques des avertissements"
        description="Quand un membre atteint un nombre d'avertissements actifs, Gaulia applique automatiquement la sanction du palier."
      >
        <EscalationEditor
          steps={draft.warnEscalation}
          onChange={(warnEscalation) => update({ warnEscalation })}
        />
      </SettingsSection>

      <SaveBar editor={editor} invalidReason={escalationError(draft.warnEscalation)} />
    </div>
  );
}
