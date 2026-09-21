"use client";

import { useTranslation, type Translator } from "@/i18n";
import type { EscalationAction, EscalationStep } from "@/lib/types";

import { DurationInput } from "./DurationInput";
import { NumberInput } from "./NumberInput";

const MAX_STEPS = 10;

const ACTIONS: readonly EscalationAction[] = ["timeout", "kick", "ban"];

export function escalationError(steps: EscalationStep[], t: Translator): string | null {
  const counts = steps.map((step) => step.warnCount);
  return new Set(counts).size === counts.length ? null : t("settings.escalation.duplicate");
}

export function EscalationEditor({
  steps,
  onChange,
}: {
  steps: EscalationStep[];
  onChange: (steps: EscalationStep[]) => void;
}) {
  const t = useTranslation();

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
        <p className="setting-hint">{t("settings.escalation.empty")}</p>
      ) : (
        steps.map((step, index) => (
          <div key={index} className="escalation-row">
            <span>{t("settings.escalation.at")}</span>
            <NumberInput
              value={step.warnCount}
              min={1}
              max={50}
              ariaLabel={t("settings.escalation.warnCountAria")}
              onChange={(warnCount) => updateStep(index, { warnCount })}
            />
            <span>{t("settings.escalation.warnings")}</span>
            <select
              className="select"
              aria-label={t("settings.escalation.stepActionAria")}
              value={step.action}
              onChange={(event) =>
                updateStep(index, { action: event.target.value as EscalationAction })
              }
            >
              {ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {t(`settings.escalation.action.${action}`)}
                </option>
              ))}
            </select>
            {step.action === "timeout" && (
              <DurationInput
                minutes={step.timeoutMinutes}
                ariaLabel={t("settings.sanction.timeout")}
                onChange={(timeoutMinutes) => updateStep(index, { timeoutMinutes })}
              />
            )}
            <button
              type="button"
              className="button-secondary"
              onClick={() => onChange(steps.filter((_, position) => position !== index))}
            >
              {t("settings.escalation.remove")}
            </button>
          </div>
        ))
      )}
      {steps.length < MAX_STEPS && (
        <button type="button" className="button-secondary add-step" onClick={addStep}>
          {t("settings.escalation.add")}
        </button>
      )}
    </div>
  );
}
