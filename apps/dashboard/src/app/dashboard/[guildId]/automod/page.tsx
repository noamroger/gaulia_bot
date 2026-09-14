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
import { domainError, normalizeDomain } from "@/lib/domains";
import type { AutomodRules, AutomodSettings } from "@/lib/types";
import { useEditableResource } from "@/lib/useEditableResource";
import { useGuildResources } from "@/lib/useGuildResources";

export default function AutomodPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { resources, failed } = useGuildResources(guildId);
  const editor = useEditableResource<AutomodSettings>(`/guilds/${guildId}/automod`);

  if (failed || editor.loadFailed) {
    return <div className="empty-state">Impossible de charger l&apos;automod de ce serveur.</div>;
  }
  if (!resources || !editor.draft) {
    return <p className="text-muted">Chargement…</p>;
  }

  const { draft, update } = editor;
  const { rules } = draft;

  function setRule<K extends keyof AutomodRules>(key: K, patch: Partial<AutomodRules[K]>): void {
    update({ rules: { ...rules, [key]: { ...rules[key], ...patch } as AutomodRules[K] } });
  }

  const channelOptions = resources.channels.map((channel) => ({
    id: channel.id,
    label: `#${channel.name}`,
  }));
  const roleOptions = resources.roles.map((role) => ({ id: role.id, label: `@${role.name}` }));

  return (
    <div className="settings-page">
      <p className="text-muted">
        Chaque règle a sa propre sanction. Elles s&apos;ajoutent aux règles AutoMod natives de
        Discord, créées avec <code>/automod setup</code>.
      </p>

      <SettingsSection
        title="Exemptions"
        description="Membres et salons jamais contrôlés par l'automod."
      >
        <SettingRow
          label="Ignorer l'équipe de modération"
          hint="Membres ayant la permission « Gérer les messages »."
        >
          <Toggle
            checked={draft.exemptStaff}
            onChange={(exemptStaff) => update({ exemptStaff })}
          />
        </SettingRow>
        <SettingRow label="Salons ignorés">
          <MultiPicker
            values={draft.ignoredChannelIds}
            options={channelOptions}
            addLabel="Ajouter un salon…"
            emptyLabel="Aucun salon ignoré"
            ariaLabel="Ajouter un salon ignoré"
            onChange={(ignoredChannelIds) => update({ ignoredChannelIds })}
          />
        </SettingRow>
        <SettingRow label="Rôles ignorés">
          <MultiPicker
            values={draft.ignoredRoleIds}
            options={roleOptions}
            addLabel="Ajouter un rôle…"
            emptyLabel="Aucun rôle ignoré"
            ariaLabel="Ajouter un rôle ignoré"
            onChange={(ignoredRoleIds) => update({ ignoredRoleIds })}
          />
        </SettingRow>
      </SettingsSection>

      <RuleCard
        title="Liens"
        description="Filtre les liens selon leur nom de domaine."
        enabled={rules.links.enabled}
        onToggle={(enabled) => setRule("links", { enabled })}
      >
        <div className="segmented" role="group" aria-label="Mode du filtre de liens">
          <button
            type="button"
            aria-pressed={rules.links.mode === "blocklist"}
            onClick={() => setRule("links", { mode: "blocklist" })}
          >
            Liste noire
          </button>
          <button
            type="button"
            aria-pressed={rules.links.mode === "allowlist"}
            onClick={() => setRule("links", { mode: "allowlist" })}
          >
            Liste blanche
          </button>
        </div>
        <span className="setting-hint">
          {rules.links.mode === "blocklist"
            ? "Seuls les liens vers ces domaines sont sanctionnés."
            : rules.links.domains.length === 0
              ? "Liste vide : tous les liens seront sanctionnés."
              : "Tous les liens sont sanctionnés, sauf ceux vers ces domaines."}{" "}
          Les sous-domaines sont inclus.
        </span>
        <TagInput
          values={rules.links.domains}
          placeholder="exemple.com"
          ariaLabel="Ajouter un domaine"
          maxItems={200}
          normalize={normalizeDomain}
          validate={domainError}
          onChange={(domains) => setRule("links", { domains })}
        />
        <SanctionPicker value={rules.links.action} onChange={(action) => setRule("links", { action })} />
      </RuleCard>

      <RuleCard
        title="Invitations Discord"
        description="Sanctionne les invitations vers d'autres serveurs Discord."
        enabled={rules.invites.enabled}
        onToggle={(enabled) => setRule("invites", { enabled })}
      >
        <span className="setting-hint">
          Codes d&apos;invitation toujours autorisés (par exemple celui de ton serveur).
        </span>
        <TagInput
          values={rules.invites.allowedInvites}
          placeholder="Code d'invitation (ex : gaulia)"
          ariaLabel="Ajouter un code d'invitation autorisé"
          maxItems={50}
          onChange={(allowedInvites) => setRule("invites", { allowedInvites })}
        />
        <SanctionPicker
          value={rules.invites.action}
          onChange={(action) => setRule("invites", { action })}
        />
      </RuleCard>

      <RuleCard
        title="Mots interdits"
        description="Sanctionne les messages contenant un mot interdit (mot entier, sans tenir compte des majuscules)."
        enabled={rules.badWords.enabled}
        onToggle={(enabled) => setRule("badWords", { enabled })}
      >
        <TagInput
          values={rules.badWords.words}
          placeholder="Mot ou expression"
          ariaLabel="Ajouter un mot interdit"
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
        title="Mentions de masse"
        description="Sanctionne les messages qui mentionnent trop de membres ou de rôles."
        enabled={rules.mentions.enabled}
        onToggle={(enabled) => setRule("mentions", { enabled })}
      >
        <div className="inline-fields">
          <label className="inline-field">
            <span>Mentions maximum par message</span>
            <NumberInput
              value={rules.mentions.maxMentions}
              min={1}
              max={50}
              ariaLabel="Mentions maximum par message"
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
        title="Majuscules"
        description="Sanctionne les messages écrits principalement en majuscules."
        enabled={rules.caps.enabled}
        onToggle={(enabled) => setRule("caps", { enabled })}
      >
        <div className="inline-fields">
          <label className="inline-field">
            <span>Part de majuscules (%)</span>
            <NumberInput
              value={rules.caps.percent}
              min={50}
              max={100}
              ariaLabel="Part de majuscules en pourcentage"
              onChange={(percent) => setRule("caps", { percent })}
            />
          </label>
          <label className="inline-field">
            <span>À partir de (lettres)</span>
            <NumberInput
              value={rules.caps.minLength}
              min={5}
              max={200}
              ariaLabel="Nombre minimum de lettres"
              onChange={(minLength) => setRule("caps", { minLength })}
            />
          </label>
        </div>
        <SanctionPicker value={rules.caps.action} onChange={(action) => setRule("caps", { action })} />
      </RuleCard>

      <RuleCard
        title="Messages répétés"
        description="Sanctionne un membre qui envoie plusieurs fois le même message d'affilée."
        enabled={rules.duplicates.enabled}
        onToggle={(enabled) => setRule("duplicates", { enabled })}
      >
        <div className="inline-fields">
          <label className="inline-field">
            <span>Répétitions avant sanction</span>
            <NumberInput
              value={rules.duplicates.maxRepeats}
              min={2}
              max={10}
              ariaLabel="Répétitions avant sanction"
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
        title="Flood"
        description="Sanctionne un membre qui envoie trop de messages en peu de temps."
        enabled={rules.flood.enabled}
        onToggle={(enabled) => setRule("flood", { enabled })}
      >
        <div className="inline-fields">
          <label className="inline-field">
            <span>Messages</span>
            <NumberInput
              value={rules.flood.maxMessages}
              min={2}
              max={30}
              ariaLabel="Nombre de messages"
              onChange={(maxMessages) => setRule("flood", { maxMessages })}
            />
          </label>
          <label className="inline-field">
            <span>En (secondes)</span>
            <NumberInput
              value={rules.flood.perSeconds}
              min={2}
              max={60}
              ariaLabel="Fenêtre en secondes"
              onChange={(perSeconds) => setRule("flood", { perSeconds })}
            />
          </label>
        </div>
        <SanctionPicker value={rules.flood.action} onChange={(action) => setRule("flood", { action })} />
      </RuleCard>

      <SaveBar editor={editor} />
    </div>
  );
}
