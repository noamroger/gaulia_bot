"use client";

import { useParams } from "next/navigation";

import { Toggle } from "@/components/Toggle";
import { ChannelSelect } from "@/components/settings/ChannelSelect";
import { EscalationEditor, escalationError } from "@/components/settings/EscalationEditor";
import { SaveBar } from "@/components/settings/SaveBar";
import { SettingRow, SettingsSection } from "@/components/settings/SettingsSection";
import { useTranslation } from "@/i18n";
import type { GuildSettings } from "@/lib/types";
import { useEditableResource } from "@/lib/useEditableResource";
import { useGuildResources } from "@/lib/useGuildResources";

export default function GuildSettingsPage() {
  const t = useTranslation();
  const { guildId } = useParams<{ guildId: string }>();
  const { resources, failed } = useGuildResources(guildId);
  const editor = useEditableResource<GuildSettings>(`/guilds/${guildId}/settings`);

  if (failed || editor.loadFailed) {
    return <div className="empty-state">{t("settings.loadError")}</div>;
  }
  if (!resources || !editor.draft) {
    return <p className="text-muted">{t("common.state.loading")}</p>;
  }

  const { draft, update } = editor;

  return (
    <div className="settings-page">
      <SettingsSection
        title={t("settings.logs.title")}
        description={t("settings.logs.description")}
      >
        <SettingRow
          label={t("settings.logs.moderation.label")}
          hint={t("settings.logs.moderation.hint")}
        >
          <ChannelSelect
            value={draft.modLogChannelId}
            channels={resources.channels}
            emptyLabel={t("settings.logs.disabled")}
            ariaLabel={t("settings.logs.moderation.aria")}
            onChange={(modLogChannelId) => update({ modLogChannelId })}
          />
        </SettingRow>
        <SettingRow label={t("settings.logs.automod.label")} hint={t("settings.logs.automod.hint")}>
          <ChannelSelect
            value={draft.automodLogChannelId}
            channels={resources.channels}
            emptyLabel={t("settings.logs.disabled")}
            ariaLabel={t("settings.logs.automod.aria")}
            onChange={(automodLogChannelId) => update({ automodLogChannelId })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title={t("settings.sanctions.title")}>
        <SettingRow label={t("settings.sanctions.dm.label")} hint={t("settings.sanctions.dm.hint")}>
          <Toggle
            checked={draft.dmOnSanction}
            onChange={(dmOnSanction) => update({ dmOnSanction })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title={t("settings.escalation.title")}
        description={t("settings.escalation.description")}
      >
        <EscalationEditor
          steps={draft.warnEscalation}
          onChange={(warnEscalation) => update({ warnEscalation })}
        />
      </SettingsSection>

      <SaveBar editor={editor} invalidReason={escalationError(draft.warnEscalation, t)} />
    </div>
  );
}
