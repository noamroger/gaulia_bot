"use client";

import { useParams } from "next/navigation";

import { MultiPicker } from "@/components/settings/MultiPicker";
import { SaveBar } from "@/components/settings/SaveBar";
import { SettingRow, SettingsSection } from "@/components/settings/SettingsSection";
import type { GuildSettings } from "@/lib/types";
import { useEditableResource } from "@/lib/useEditableResource";
import { useGuildResources } from "@/lib/useGuildResources";

export default function FunSettingsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { resources, failed } = useGuildResources(guildId);
  const editor = useEditableResource<GuildSettings>(`/guilds/${guildId}/settings`);

  if (failed || editor.loadFailed) {
    return <div className="empty-state">Impossible de charger les réglages fun.</div>;
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
        description="Les membres ayant la permission « Administrateur » ne sont jamais concernés par cette restriction."
      >
        <SettingRow
          label="Salons des commandes fun"
          hint="Jeux, lovecalc et autres commandes fun ne fonctionnent que dans ces salons et leurs fils. Sans salon choisi, elles sont utilisables partout."
        >
          <MultiPicker
            values={draft.funChannelIds}
            options={channelOptions}
            addLabel="Ajouter un salon…"
            emptyLabel="Tous les salons"
            ariaLabel="Ajouter un salon autorisé"
            onChange={(funChannelIds) => update({ funChannelIds })}
          />
        </SettingRow>
      </SettingsSection>

      <SaveBar editor={editor} />
    </div>
  );
}
