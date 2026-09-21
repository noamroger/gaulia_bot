"use client";

import { useParams } from "next/navigation";

import { Toggle } from "@/components/Toggle";
import { MultiPicker } from "@/components/settings/MultiPicker";
import { NumberInput } from "@/components/settings/NumberInput";
import { RuleCard } from "@/components/settings/RuleCard";
import { SanctionPicker } from "@/components/settings/SanctionPicker";
import { SaveBar } from "@/components/settings/SaveBar";
import { SettingRow, SettingsSection } from "@/components/settings/SettingsSection";
import { TagInput } from "@/components/settings/TagInput";
import { useTranslation } from "@/i18n";
import { isValidDomain, normalizeDomain } from "@/lib/domains";
import type { AutomodRules, AutomodSettings } from "@/lib/types";
import { useEditableResource } from "@/lib/useEditableResource";
import { useGuildResources } from "@/lib/useGuildResources";

export default function AutomodPage() {
  const t = useTranslation();
  const { guildId } = useParams<{ guildId: string }>();
  const { resources, failed } = useGuildResources(guildId);
  const editor = useEditableResource<AutomodSettings>(`/guilds/${guildId}/automod`);

  if (failed || editor.loadFailed) {
    return <div className="empty-state">{t("automod.loadError")}</div>;
  }
  if (!resources || !editor.draft) {
    return <p className="text-muted">{t("common.state.loading")}</p>;
  }

  const { draft, update } = editor;
  const { rules } = draft;

  function setRule<K extends keyof AutomodRules>(key: K, patch: Partial<AutomodRules[K]>): void {
    update({ rules: { ...rules, [key]: { ...rules[key], ...patch } as AutomodRules[K] } });
  }

  // The domain check lives in @/lib/domains; only its wording comes from the catalog.
  function validateDomain(domain: string): string | null {
    return isValidDomain(domain) ? null : t("automod.links.invalid", { domain });
  }

  const channelOptions = resources.channels.map((channel) => ({
    id: channel.id,
    label: `#${channel.name}`,
  }));
  const roleOptions = resources.roles.map((role) => ({ id: role.id, label: `@${role.name}` }));

  return (
    <div className="settings-page">
      <p className="text-muted">
        {t("automod.intro.before")} <code>{t("automod.intro.command")}</code>
        {t("automod.intro.after")}
      </p>

      <SettingsSection
        title={t("automod.exemptions.title")}
        description={t("automod.exemptions.description")}
      >
        <SettingRow
          label={t("automod.exemptions.staff.label")}
          hint={t("automod.exemptions.staff.hint")}
        >
          <Toggle checked={draft.exemptStaff} onChange={(exemptStaff) => update({ exemptStaff })} />
        </SettingRow>
        <SettingRow label={t("automod.exemptions.channels.label")}>
          <MultiPicker
            values={draft.ignoredChannelIds}
            options={channelOptions}
            addLabel={t("automod.exemptions.channels.add")}
            emptyLabel={t("automod.exemptions.channels.empty")}
            ariaLabel={t("automod.exemptions.channels.aria")}
            onChange={(ignoredChannelIds) => update({ ignoredChannelIds })}
          />
        </SettingRow>
        <SettingRow label={t("automod.exemptions.roles.label")}>
          <MultiPicker
            values={draft.ignoredRoleIds}
            options={roleOptions}
            addLabel={t("automod.exemptions.roles.add")}
            emptyLabel={t("automod.exemptions.roles.empty")}
            ariaLabel={t("automod.exemptions.roles.aria")}
            onChange={(ignoredRoleIds) => update({ ignoredRoleIds })}
          />
        </SettingRow>
      </SettingsSection>

      <RuleCard
        title={t("automod.links.title")}
        description={t("automod.links.description")}
        enabled={rules.links.enabled}
        onToggle={(enabled) => setRule("links", { enabled })}
      >
        <div className="segmented" role="group" aria-label={t("automod.links.modeAria")}>
          <button
            type="button"
            aria-pressed={rules.links.mode === "blocklist"}
            onClick={() => setRule("links", { mode: "blocklist" })}
          >
            {t("automod.links.blocklist")}
          </button>
          <button
            type="button"
            aria-pressed={rules.links.mode === "allowlist"}
            onClick={() => setRule("links", { mode: "allowlist" })}
          >
            {t("automod.links.allowlist")}
          </button>
        </div>
        <span className="setting-hint">
          {rules.links.mode === "blocklist"
            ? t("automod.links.blocklistHint")
            : rules.links.domains.length === 0
              ? t("automod.links.allowlistEmptyHint")
              : t("automod.links.allowlistHint")}{" "}
          {t("automod.links.subdomains")}
        </span>
        <TagInput
          values={rules.links.domains}
          placeholder={t("automod.links.placeholder")}
          ariaLabel={t("automod.links.addAria")}
          maxItems={200}
          normalize={normalizeDomain}
          validate={validateDomain}
          onChange={(domains) => setRule("links", { domains })}
        />
        <SanctionPicker
          value={rules.links.action}
          onChange={(action) => setRule("links", { action })}
        />
      </RuleCard>

      <RuleCard
        title={t("automod.invites.title")}
        description={t("automod.invites.description")}
        enabled={rules.invites.enabled}
        onToggle={(enabled) => setRule("invites", { enabled })}
      >
        <span className="setting-hint">{t("automod.invites.hint")}</span>
        <TagInput
          values={rules.invites.allowedInvites}
          placeholder={t("automod.invites.placeholder")}
          ariaLabel={t("automod.invites.addAria")}
          maxItems={50}
          onChange={(allowedInvites) => setRule("invites", { allowedInvites })}
        />
        <SanctionPicker
          value={rules.invites.action}
          onChange={(action) => setRule("invites", { action })}
        />
      </RuleCard>

      <RuleCard
        title={t("automod.badWords.title")}
        description={t("automod.badWords.description")}
        enabled={rules.badWords.enabled}
        onToggle={(enabled) => setRule("badWords", { enabled })}
      >
        <TagInput
          values={rules.badWords.words}
          placeholder={t("automod.badWords.placeholder")}
          ariaLabel={t("automod.badWords.addAria")}
          maxItems={500}
          normalize={(value) => value.trim().toLowerCase()}
          onChange={(words) => setRule("badWords", { words })}
        />
        <SanctionPicker
          value={rules.badWords.action}
          onChange={(action) => setRule("badWords", { action })}
        />
      </RuleCard>

      <RuleCard
        title={t("automod.mentions.title")}
        description={t("automod.mentions.description")}
        enabled={rules.mentions.enabled}
        onToggle={(enabled) => setRule("mentions", { enabled })}
      >
        <div className="inline-fields">
          <label className="inline-field">
            <span>{t("automod.mentions.max")}</span>
            <NumberInput
              value={rules.mentions.maxMentions}
              min={1}
              max={50}
              ariaLabel={t("automod.mentions.max")}
              onChange={(maxMentions) => setRule("mentions", { maxMentions })}
            />
          </label>
        </div>
        <SanctionPicker
          value={rules.mentions.action}
          onChange={(action) => setRule("mentions", { action })}
        />
      </RuleCard>

      <RuleCard
        title={t("automod.caps.title")}
        description={t("automod.caps.description")}
        enabled={rules.caps.enabled}
        onToggle={(enabled) => setRule("caps", { enabled })}
      >
        <div className="inline-fields">
          <label className="inline-field">
            <span>{t("automod.caps.percent")}</span>
            <NumberInput
              value={rules.caps.percent}
              min={50}
              max={100}
              ariaLabel={t("automod.caps.percentAria")}
              onChange={(percent) => setRule("caps", { percent })}
            />
          </label>
          <label className="inline-field">
            <span>{t("automod.caps.minLength")}</span>
            <NumberInput
              value={rules.caps.minLength}
              min={5}
              max={200}
              ariaLabel={t("automod.caps.minLengthAria")}
              onChange={(minLength) => setRule("caps", { minLength })}
            />
          </label>
        </div>
        <SanctionPicker
          value={rules.caps.action}
          onChange={(action) => setRule("caps", { action })}
        />
      </RuleCard>

      <RuleCard
        title={t("automod.duplicates.title")}
        description={t("automod.duplicates.description")}
        enabled={rules.duplicates.enabled}
        onToggle={(enabled) => setRule("duplicates", { enabled })}
      >
        <div className="inline-fields">
          <label className="inline-field">
            <span>{t("automod.duplicates.max")}</span>
            <NumberInput
              value={rules.duplicates.maxRepeats}
              min={2}
              max={10}
              ariaLabel={t("automod.duplicates.max")}
              onChange={(maxRepeats) => setRule("duplicates", { maxRepeats })}
            />
          </label>
        </div>
        <SanctionPicker
          value={rules.duplicates.action}
          onChange={(action) => setRule("duplicates", { action })}
        />
      </RuleCard>

      <RuleCard
        title={t("automod.flood.title")}
        description={t("automod.flood.description")}
        enabled={rules.flood.enabled}
        onToggle={(enabled) => setRule("flood", { enabled })}
      >
        <div className="inline-fields">
          <label className="inline-field">
            <span>{t("automod.flood.messages")}</span>
            <NumberInput
              value={rules.flood.maxMessages}
              min={2}
              max={30}
              ariaLabel={t("automod.flood.messagesAria")}
              onChange={(maxMessages) => setRule("flood", { maxMessages })}
            />
          </label>
          <label className="inline-field">
            <span>{t("automod.flood.seconds")}</span>
            <NumberInput
              value={rules.flood.perSeconds}
              min={2}
              max={60}
              ariaLabel={t("automod.flood.secondsAria")}
              onChange={(perSeconds) => setRule("flood", { perSeconds })}
            />
          </label>
        </div>
        <SanctionPicker
          value={rules.flood.action}
          onChange={(action) => setRule("flood", { action })}
        />
      </RuleCard>

      <SaveBar editor={editor} />
    </div>
  );
}
