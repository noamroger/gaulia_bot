"use client";

import { useTranslation } from "@/i18n";

export interface PickerOption {
  id: string;
  label: string;
}

export function MultiPicker({
  values,
  options,
  addLabel,
  emptyLabel,
  ariaLabel,
  onChange,
}: {
  values: string[];
  options: PickerOption[];
  addLabel: string;
  emptyLabel: string;
  ariaLabel: string;
  onChange: (values: string[]) => void;
}) {
  const t = useTranslation();
  const labelFor = (id: string) =>
    options.find((option) => option.id === id)?.label ?? t("settings.picker.unknown");
  const available = options.filter((option) => !values.includes(option.id));

  return (
    <div className="multi-picker">
      <div className="chip-list">
        {values.length === 0 ? (
          <span className="setting-hint">{emptyLabel}</span>
        ) : (
          values.map((id) => (
            <span key={id} className="chip">
              {labelFor(id)}
              <button
                type="button"
                aria-label={t("settings.picker.remove", { label: labelFor(id) })}
                onClick={() => onChange(values.filter((value) => value !== id))}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
      {available.length > 0 && (
        <select
          className="select"
          aria-label={ariaLabel}
          value=""
          onChange={(event) => {
            if (event.target.value) onChange([...values, event.target.value]);
          }}
        >
          <option value="">{addLabel}</option>
          {available.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
