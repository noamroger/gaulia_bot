import type { Sanction, SanctionType } from "@/lib/types";

import { DurationInput } from "./DurationInput";

const SANCTION_LABELS: Record<SanctionType, string> = {
  delete: "Supprimer le message",
  warn: "Supprimer et avertir",
  timeout: "Supprimer et mettre en sourdine",
  kick: "Supprimer et expulser",
  ban: "Supprimer et bannir",
};

export function SanctionPicker({
  value,
  onChange,
}: {
  value: Sanction;
  onChange: (value: Sanction) => void;
}) {
  return (
    <div className="inline-fields">
      <label className="inline-field">
        <span>Sanction</span>
        <select
          className="select"
          value={value.type}
          onChange={(event) => onChange({ ...value, type: event.target.value as SanctionType })}
        >
          {(Object.keys(SANCTION_LABELS) as SanctionType[]).map((type) => (
            <option key={type} value={type}>
              {SANCTION_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
      {value.type === "timeout" && (
        <div className="inline-field">
          <span>Durée de la sourdine</span>
          <DurationInput
            minutes={value.timeoutMinutes}
            ariaLabel="Durée de la sourdine"
            onChange={(timeoutMinutes) => onChange({ ...value, timeoutMinutes })}
          />
        </div>
      )}
    </div>
  );
}
