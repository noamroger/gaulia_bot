"use client";

import { useState } from "react";

import { useTranslation } from "@/i18n";

export function TagInput({
  values,
  placeholder,
  ariaLabel,
  maxItems,
  normalize = (value) => value.trim(),
  validate,
  onChange,
}: {
  values: string[];
  placeholder: string;
  ariaLabel: string;
  maxItems: number;
  normalize?: (value: string) => string;
  validate?: (value: string) => string | null;
  onChange: (values: string[]) => void;
}) {
  const t = useTranslation();
  const [text, setText] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const full = values.length >= maxItems;

  function commit(): void {
    const items = text
      .split(/[,\n]/)
      .map(normalize)
      .filter((item) => item.length > 0);
    if (items.length === 0) return;

    for (const item of items) {
      const itemProblem = validate?.(item) ?? null;
      if (itemProblem) {
        setProblem(itemProblem);
        return;
      }
    }

    onChange([...new Set([...values, ...items])].slice(0, maxItems));
    setText("");
    setProblem(null);
  }

  return (
    <div className="tag-input">
      {values.length > 0 && (
        <div className="chip-list">
          {values.map((value) => (
            <span key={value} className="chip">
              {value}
              <button
                type="button"
                aria-label={t("settings.tags.remove", { value })}
                onClick={() => onChange(values.filter((item) => item !== value))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="inline-fields">
        <input
          className="input"
          value={text}
          placeholder={full ? t("settings.tags.full") : placeholder}
          aria-label={ariaLabel}
          disabled={full}
          onChange={(event) => {
            setText(event.target.value);
            setProblem(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
          }}
        />
        <button
          type="button"
          className="button-secondary"
          disabled={full || text.trim() === ""}
          onClick={commit}
        >
          {t("settings.tags.add")}
        </button>
        <span className="setting-hint">
          {values.length} / {maxItems}
        </span>
      </div>
      {problem && (
        <p className="input-error" role="alert">
          {problem}
        </p>
      )}
    </div>
  );
}
