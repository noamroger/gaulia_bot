"use client";

import { useEffect, useState } from "react";

/** Every valid value is reported while typing; the field is clamped on blur. */
export function NumberInput({
  value,
  min,
  max,
  ariaLabel,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  ariaLabel: string;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  function handleChange(next: string): void {
    setText(next);
    const parsed = Number.parseInt(next, 10);
    if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) onChange(parsed);
  }

  function handleBlur(): void {
    const parsed = Number.parseInt(text, 10);
    const clamped = Number.isNaN(parsed) ? value : Math.min(max, Math.max(min, parsed));
    setText(String(clamped));
    if (clamped !== value) onChange(clamped);
  }

  return (
    <input
      className="input input-number"
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={text}
      aria-label={ariaLabel}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={handleBlur}
    />
  );
}
