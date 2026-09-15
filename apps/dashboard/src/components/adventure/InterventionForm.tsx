"use client";

import { useState, type FormEvent } from "react";

import type { AdventureCatalogue, AdventureIntervention } from "@/lib/types";

const KIND_LABELS: Record<string, string> = {
  EQUIPEMENT: "Équipement",
  CONSOMMABLE: "Consommables",
  MATERIAU: "Matériaux",
  TRESOR: "Trésors",
  RELIQUE: "Reliques",
};

/** Champ numérique optionnel : vide = pas de modification de cette valeur. */
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
        placeholder="—"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="setting-hint">{hint}</span>
    </label>
  );
}

/**
 * Interventions du propriétaire dans la partie d'un joueur : expérience, or, fragments, énergie,
 * points de caractéristique, niveau et objets. Tout est optionnel et rien n'est envoyé tant que la
 * modification n'a pas été confirmée.
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

  const grouped = Object.entries(KIND_LABELS).map(([kind, label]) => ({
    label,
    items: (catalogue?.items ?? []).filter((item) => item.kind === kind),
  }));

  return (
    <form className="card intervention-form" onSubmit={(event) => void submit(event)}>
      <h3 className="card-title">Intervenir dans la partie</h3>
      <p className="card-subtitle">
        Laisse un champ vide pour ne pas y toucher. Les valeurs sont des variations (un nombre
        négatif retire), sauf le niveau, qui est fixé directement. Chaque intervention est inscrite
        dans le journal du joueur.
      </p>

      <div className="inline-fields">
        <NumberField
          label="Expérience"
          hint="Ajoutée comme en jeu (les niveaux montent)."
          value={xp}
          onChange={setXp}
        />
        <NumberField label="Pièces" hint="Négatif pour retirer." value={gold} onChange={setGold} />
        <NumberField
          label="Fragments d'écho"
          hint="La monnaie du scénario."
          value={echoes}
          onChange={setEchoes}
        />
        <NumberField
          label="Énergie"
          hint={`Plafond : ${catalogue?.maxEnergy ?? 20}.`}
          value={energy}
          onChange={setEnergy}
        />
        <NumberField
          label="Points de caractéristique"
          hint="À répartir par le joueur."
          value={statPoints}
          onChange={setStatPoints}
        />
        <NumberField
          label="Niveau"
          hint={`Valeur fixée (1 à ${catalogue?.maxLevel ?? 100}).`}
          value={level}
          onChange={setLevel}
        />
      </div>

      <div className="inline-fields">
        <label className="field">
          <span>Objet</span>
          <select
            className="select"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
          >
            <option value="">Aucun objet</option>
            {grouped.map((group) =>
              group.items.length === 0 ? null : (
                <optgroup key={group.label} label={group.label}>
                  {group.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.emoji} {item.name}
                    </option>
                  ))}
                </optgroup>
              ),
            )}
          </select>
        </label>
        <label className="field">
          <span>Quantité</span>
          <input
            className="input input-number"
            type="number"
            inputMode="numeric"
            value={itemQuantity}
            onChange={(event) => setItemQuantity(event.target.value)}
          />
          <span className="setting-hint">Négatif pour retirer du sac.</span>
        </label>
        <label className="field input-grow">
          <span>Raison</span>
          <input
            className="input"
            type="text"
            maxLength={200}
            placeholder="Compensation d'un bug, événement…"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
      </div>

      {confirming && (
        <div className="confirm-box">
          Confirme l&apos;intervention : elle sera appliquée immédiatement et visible dans le
          journal du joueur.
        </div>
      )}

      <div className="save-bar-actions">
        {confirming && (
          <button type="button" className="button-secondary" onClick={() => setConfirming(false)}>
            Annuler
          </button>
        )}
        <button type="submit" className="button-primary" disabled={!hasChange || pending}>
          {pending ? "Application…" : confirming ? "Confirmer" : "Appliquer"}
        </button>
      </div>
    </form>
  );
}
