"use client";

import { useParams } from "next/navigation";

import { MultiPicker } from "@/components/settings/MultiPicker";
import { SaveBar } from "@/components/settings/SaveBar";
import { SettingRow, SettingsSection } from "@/components/settings/SettingsSection";
import { useTranslation } from "@/i18n";
import type { GuildSettings } from "@/lib/types";
import { useEditableResource } from "@/lib/useEditableResource";
import { useGuildResources } from "@/lib/useGuildResources";

export default function FunSettingsPage() {
  const t = useTranslation();
  const { guildId } = useParams<{ guildId: string }>();
  const { resources, failed } = useGuildResources(guildId);
  const editor = useEditableResource<GuildSettings>(`/guilds/${guildId}/settings`);

  if (failed || editor.loadFailed) {
    return <div className="empty-state">{t("fun.loadError")}</div>;
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
      <SettingsSection title={t("fun.access.title")} description={t("fun.access.description")}>
        <SettingRow label={t("fun.access.channels.label")} hint={t("fun.access.channels.hint")}>
          <MultiPicker
            values={draft.funChannelIds}
            options={channelOptions}
            addLabel={t("fun.access.channels.add")}
            emptyLabel={t("fun.access.channels.empty")}
            ariaLabel={t("fun.access.channels.aria")}
            onChange={(funChannelIds) => update({ funChannelIds })}
          />
        </SettingRow>
      </SettingsSection>

      <SaveBar editor={editor} />
    </div>
  );
}
