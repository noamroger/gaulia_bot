"use client";

import { useParams } from "next/navigation";

import { Toggle } from "@/components/Toggle";
import { MultiPicker } from "@/components/settings/MultiPicker";
import { SaveBar } from "@/components/settings/SaveBar";
import { SettingRow, SettingsSection } from "@/components/settings/SettingsSection";
import { useTranslation } from "@/i18n";
import type { AdventureChannelMode, GuildSettings } from "@/lib/types";
import { useEditableResource } from "@/lib/useEditableResource";
import { useGuildResources } from "@/lib/useGuildResources";

const CHANNEL_MODES: readonly AdventureChannelMode[] = ["ALLOWLIST", "BLOCKLIST"];

export default function AdventureSettingsPage() {
  const t = useTranslation();
  const { guildId } = useParams<{ guildId: string }>();
  const { resources, failed } = useGuildResources(guildId);
  const editor = useEditableResource<GuildSettings>(`/guilds/${guildId}/settings`);

  if (failed || editor.loadFailed) {
    return <div className="empty-state">{t("adventure.loadError")}</div>;
  }
  if (!resources || !editor.draft) {
    return <p className="text-muted">{t("common.state.loading")}</p>;
  }

  const { draft, update } = editor;
  const channelOptions = resources.channels.map((channel) => ({
    id: channel.id,
    label: `#${channel.name}`,
  }));

  const allowlist = draft.adventureChannelMode === "ALLOWLIST";
  const count = draft.adventureChannelIds.length;

  // One sentence spelling out what mode plus list actually allows, so the combination is never
  // ambiguous.
  const summary = !draft.adventureEnabled
    ? t("adventure.summary.disabled")
    : allowlist
      ? count === 0
        ? t("adventure.summary.allowlistEmpty")
        : t("adventure.summary.allowlist", { count })
      : count === 0
        ? t("adventure.summary.blocklistEmpty")
        : t("adventure.summary.blocklist", { count });

  return (
    <div className="settings-page">
      <SettingsSection
        title={t("adventure.where.title")}
        description={t("adventure.where.description")}
      >
        <SettingRow
          label={t("adventure.where.module.label")}
          hint={t("adventure.where.module.hint")}
        >
          <Toggle
            checked={draft.adventureEnabled}
            onChange={(adventureEnabled) => update({ adventureEnabled })}
          />
        </SettingRow>

        <SettingRow label={t("adventure.where.mode.label")} hint={t("adventure.where.mode.hint")}>
          <select
            className="select"
            aria-label={t("adventure.where.mode.aria")}
            value={draft.adventureChannelMode}
            onChange={(event) =>
              update({ adventureChannelMode: event.target.value as AdventureChannelMode })
            }
          >
            {CHANNEL_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(`adventure.channelMode.${mode}`)}
              </option>
            ))}
          </select>
        </SettingRow>

        <SettingRow
          label={allowlist ? t("adventure.where.allowedLabel") : t("adventure.where.blockedLabel")}
          hint={allowlist ? t("adventure.where.allowedHint") : t("adventure.where.blockedHint")}
        >
          <MultiPicker
            values={draft.adventureChannelIds}
            options={channelOptions}
            addLabel={t("adventure.where.add")}
            emptyLabel={
              allowlist ? t("adventure.where.emptyAllowlist") : t("adventure.where.emptyBlocklist")
            }
            ariaLabel={t("adventure.where.aria")}
            onChange={(adventureChannelIds) => update({ adventureChannelIds })}
          />
        </SettingRow>

        <SettingRow label={t("adventure.where.result")}>
          <span className="setting-hint">{summary}</span>
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title={t("adventure.about.title")}
        description={t("adventure.about.description")}
      >
        <SettingRow
          label={t("adventure.about.progression.label")}
          hint={t("adventure.about.progression.hint")}
        >
          <span className="setting-hint">{t("adventure.about.progression.value")}</span>
        </SettingRow>
        <SettingRow
          label={t("adventure.about.commands.label")}
          hint={t("adventure.about.commands.hint")}
        >
          <span className="setting-hint">{t("adventure.about.commands.value")}</span>
        </SettingRow>
        <SettingRow
          label={t("adventure.about.trades.label")}
          hint={t("adventure.about.trades.hint")}
        >
          <span className="setting-hint">{t("adventure.about.trades.value")}</span>
        </SettingRow>
      </SettingsSection>

      <SaveBar editor={editor} />
    </div>
  );
}
