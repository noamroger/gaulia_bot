"use client";

import { Toggle } from "@/components/Toggle";
import { useLocale, useTranslation } from "@/i18n";
import { formatNumber } from "@/lib/format";
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
  const t = useTranslation();
  const locale = useLocale();

  return (
    <ul className="toggle-list">
      {presets.map((preset) => {
        const enabled = !disabled.includes(preset.id);
        return (
          <li key={preset.id} className="toggle-item">
            <span className="toggle-item-text">
              <strong>{preset.name}</strong>
              <span className="setting-hint">
                {t("music.blindtest.categories.tracks", {
                  count: preset.trackCount,
                  value: formatNumber(preset.trackCount, locale),
                })}
              </span>
            </span>
            <Toggle
              checked={enabled}
              ariaLabel={t("music.blindtest.categories.toggleAria", { name: preset.name })}
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
