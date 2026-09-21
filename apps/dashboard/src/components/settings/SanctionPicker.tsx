"use client";

import { useTranslation } from "@/i18n";
import type { Sanction, SanctionType } from "@/lib/types";

import { DurationInput } from "./DurationInput";

const TYPES: readonly SanctionType[] = ["delete", "warn", "timeout", "kick", "ban"];

export function SanctionPicker({
  value,
  onChange,
}: {
  value: Sanction;
  onChange: (value: Sanction) => void;
}) {
  const t = useTranslation();

  return (
    <div className="inline-fields">
      <label className="inline-field">
        <span>{t("settings.sanction.label")}</span>
        <select
          className="select"
          value={value.type}
          onChange={(event) => onChange({ ...value, type: event.target.value as SanctionType })}
        >
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`settings.sanction.type.${type}`)}
            </option>
          ))}
        </select>
      </label>
      {value.type === "timeout" && (
        <div className="inline-field">
          <span>{t("settings.sanction.timeout")}</span>
          <DurationInput
            minutes={value.timeoutMinutes}
            ariaLabel={t("settings.sanction.timeout")}
            onChange={(timeoutMinutes) => onChange({ ...value, timeoutMinutes })}
          />
        </div>
      )}
    </div>
  );
}
