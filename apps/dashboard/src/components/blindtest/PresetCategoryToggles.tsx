"use client";

import { Toggle } from "@/components/Toggle";
import type { BlindtestPreset } from "@/lib/types";

export function PresetCategoryToggles({
  presets,
  disabled,
  onChange,
}: {
  presets: BlindtestPreset[];
  disabled: string[];
  onChange: (disabled: string[]) => void;
}) {
  return (
    <ul className="toggle-list">
      {presets.map((preset) => {
        const enabled = !disabled.includes(preset.id);
        return (
          <li key={preset.id} className="toggle-item">
            <span className="toggle-item-text">
              <strong>{preset.name}</strong>
              <span className="setting-hint">{preset.trackCount} titres</span>
            </span>
            <Toggle
              checked={enabled}
              ariaLabel={`Proposer la catégorie ${preset.name}`}
              onChange={(value) =>
                onChange(
                  value
                    ? disabled.filter((id) => id !== preset.id)
                    : [...new Set([...disabled, preset.id])],
                )
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
