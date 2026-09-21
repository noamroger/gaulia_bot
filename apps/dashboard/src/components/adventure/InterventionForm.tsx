"use client";

import { useState, type FormEvent } from "react";

import { useTranslation } from "@/i18n";
import type { AdventureCatalogue, AdventureIntervention } from "@/lib/types";

/** Prisma item kinds, kept as stored; only their labels come from the catalog. */
const ITEM_KINDS = ["EQUIPEMENT", "CONSOMMABLE", "MATERIAU", "TRESOR", "RELIQUE"] as const;

/** Optional number field: empty means this value is left alone. */
function NumberField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="input input-number"
        type="number"
        inputMode="numeric"
        placeholder="-"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="setting-hint">{hint}</span>
    </label>
  );
}

/**
 * Owner interventions in a player's game: experience, gold, shards, energy, stat points, level and
 * items. Everything is optional and nothing is sent until the change has been confirmed.
 */
export function InterventionForm({
  catalogue,
  pending,
  onSubmit,
}: {
  catalogue: AdventureCatalogue | null;
  pending: boolean;
  onSubmit: (intervention: AdventureIntervention) => Promise<void>;
}) {
  const t = useTranslation();
  const [xp, setXp] = useState("");
  const [gold, setGold] = useState("");
  const [echoes, setEchoes] = useState("");
  const [energy, setEnergy] = useState("");
  const [statPoints, setStatPoints] = useState("");
  const [level, setLevel] = useState("");
  const [itemId, setItemId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);

  const integer = (raw: string): number | undefined => {
    const value = Number(raw);
    return raw.trim() !== "" && Number.isInteger(value) ? value : undefined;
  };

  const quantity = integer(itemQuantity);
  const intervention: AdventureIntervention = {
    ...(integer(xp) !== undefined ? { xp: integer(xp) } : {}),
    ...(integer(gold) !== undefined ? { gold: integer(gold) } : {}),
    ...(integer(echoes) !== undefined ? { echoes: integer(echoes) } : {}),
    ...(integer(energy) !== undefined ? { energy: integer(energy) } : {}),
    ...(integer(statPoints) !== undefined ? { statPoints: integer(statPoints) } : {}),
    ...(integer(level) !== undefined ? { level: integer(level) } : {}),
    ...(itemId && quantity !== undefined && quantity !== 0
      ? { items: [{ itemId, quantity }] }
      : {}),
    ...(reason.trim() ? { reason: reason.trim() } : {}),
  };

  const hasChange =
    intervention.xp !== undefined ||
    intervention.gold !== undefined ||
    intervention.echoes !== undefined ||
    intervention.energy !== undefined ||
    intervention.statPoints !== undefined ||
    intervention.level !== undefined ||
    (intervention.items?.length ?? 0) > 0;

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!hasChange) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }

    await onSubmit(intervention);
    setXp("");
    setGold("");
    setEchoes("");
    setEnergy("");
    setStatPoints("");
    setLevel("");
    setItemId("");
    setItemQuantity("1");
    setReason("");
    setConfirming(false);
  }

  const grouped = ITEM_KINDS.map((kind) => ({
    label: t(`adventure.admin.itemKind.${kind}`),
    items: (catalogue?.items ?? []).filter((item) => item.kind === kind),
  }));

  return (
    <form className="card intervention-form" onSubmit={(event) => void submit(event)}>
      <h3 className="card-title">{t("adventure.admin.intervention.title")}</h3>
      <p className="card-subtitle">{t("adventure.admin.intervention.description")}</p>

      <div className="inline-fields">
        <NumberField
          label={t("adventure.admin.intervention.xp.label")}
          hint={t("adventure.admin.intervention.xp.hint")}
          value={xp}
          onChange={setXp}
        />
        <NumberField
          label={t("adventure.admin.intervention.gold.label")}
          hint={t("adventure.admin.intervention.gold.hint")}
          value={gold}
          onChange={setGold}
        />
        <NumberField
          label={t("adventure.admin.intervention.echoes.label")}
          hint={t("adventure.admin.intervention.echoes.hint")}
          value={echoes}
          onChange={setEchoes}
        />
        <NumberField
          label={t("adventure.admin.intervention.energy.label")}
          hint={t("adventure.admin.intervention.energy.hint", { max: catalogue?.maxEnergy ?? 20 })}
          value={energy}
          onChange={setEnergy}
        />
        <NumberField
          label={t("adventure.admin.intervention.statPoints.label")}
          hint={t("adventure.admin.intervention.statPoints.hint")}
          value={statPoints}
          onChange={setStatPoints}
        />
        <NumberField
          label={t("adventure.admin.intervention.level.label")}
          hint={t("adventure.admin.intervention.level.hint", { max: catalogue?.maxLevel ?? 100 })}
          value={level}
          onChange={setLevel}
        />
      </div>

      <div className="inline-fields">
        <label className="field">
          <span>{t("adventure.admin.intervention.item.label")}</span>
          <select
            className="select"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
          >
            <option value="">{t("adventure.admin.intervention.item.none")}</option>
            {grouped.map((group) =>
              group.items.length === 0 ? null : (
                <optgroup key={group.label} label={group.label}>
                  {group.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.emoji} {item.name}
                      {item.tradable ? "" : t("adventure.admin.intervention.item.notTradable")}
                    </option>
                  ))}
                </optgroup>
              ),
            )}
          </select>
        </label>
        <label className="field">
          <span>{t("adventure.admin.intervention.quantity.label")}</span>
          <input
            className="input input-number"
            type="number"
            inputMode="numeric"
            value={itemQuantity}
            onChange={(event) => setItemQuantity(event.target.value)}
          />
          <span className="setting-hint">{t("adventure.admin.intervention.quantity.hint")}</span>
        </label>
        <label className="field input-grow">
          <span>{t("adventure.admin.intervention.reason.label")}</span>
          <input
            className="input"
            type="text"
            maxLength={200}
            placeholder={t("adventure.admin.intervention.reason.placeholder")}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
      </div>

      {confirming && <div className="confirm-box">{t("adventure.admin.intervention.confirm")}</div>}

      <div className="save-bar-actions">
        {confirming && (
          <button type="button" className="button-secondary" onClick={() => setConfirming(false)}>
            {t("common.action.cancel")}
          </button>
        )}
        <button type="submit" className="button-primary" disabled={!hasChange || pending}>
          {pending
            ? t("adventure.admin.intervention.applying")
            : confirming
              ? t("common.action.confirm")
              : t("adventure.admin.intervention.apply")}
        </button>
      </div>
    </form>
  );
}
