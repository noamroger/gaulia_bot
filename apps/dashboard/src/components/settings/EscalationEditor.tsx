import type { EscalationAction, EscalationStep } from "@/lib/types";

import { DurationInput } from "./DurationInput";
import { NumberInput } from "./NumberInput";

const MAX_STEPS = 10;

const ACTION_LABELS: Record<EscalationAction, string> = {
  timeout: "Sourdine",
  kick: "Expulsion",
  ban: "Bannissement",
};

export function escalationError(steps: EscalationStep[]): string | null {
  const counts = steps.map((step) => step.warnCount);
  return new Set(counts).size === counts.length
    ? null
    : "Deux paliers ont le même nombre d'avertissements.";
}

export function EscalationEditor({
  steps,
  onChange,
}: {
  steps: EscalationStep[];
  onChange: (steps: EscalationStep[]) => void;
}) {
  function updateStep(index: number, patch: Partial<EscalationStep>): void {
    onChange(steps.map((step, position) => (position === index ? { ...step, ...patch } : step)));
  }

  function addStep(): void {
    const next = steps.length ? Math.max(...steps.map((step) => step.warnCount)) + 1 : 3;
    onChange([...steps, { warnCount: Math.min(50, next), action: "timeout", timeoutMinutes: 60 }]);
  }

  return (
    <div>
      {steps.length === 0 ? (
        <p className="setting-hint">
          Aucun palier : les avertissements n&apos;entraînent pas de sanction automatique.
        </p>
      ) : (
        steps.map((step, index) => (
          <div key={index} className="escalation-row">
            <span>À</span>
            <NumberInput
              value={step.warnCount}
              min={1}
              max={50}
              ariaLabel="Nombre d'avertissements"
              onChange={(warnCount) => updateStep(index, { warnCount })}
            />
            <span>avertissements :</span>
            <select
              className="select"
              aria-label="Sanction du palier"
              value={step.action}
              onChange={(event) =>
                updateStep(index, { action: event.target.value as EscalationAction })
              }
            >
              {(Object.keys(ACTION_LABELS) as EscalationAction[]).map((action) => (
                <option key={action} value={action}>
                  {ACTION_LABELS[action]}
                </option>
              ))}
            </select>
            {step.action === "timeout" && (
              <DurationInput
                minutes={step.timeoutMinutes}
                ariaLabel="Durée de la sourdine"
                onChange={(timeoutMinutes) => updateStep(index, { timeoutMinutes })}
              />
            )}
            <button
              type="button"
              className="button-secondary"
              onClick={() => onChange(steps.filter((_, position) => position !== index))}
            >
              Retirer
            </button>
          </div>
        ))
      )}
      {steps.length < MAX_STEPS && (
        <button type="button" className="button-secondary add-step" onClick={addStep}>
          Ajouter un palier
        </button>
      )}
    </div>
  );
}
