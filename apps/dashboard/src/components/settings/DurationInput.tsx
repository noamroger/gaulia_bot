"use client";

import { useState } from "react";

import { NumberInput } from "./NumberInput";

/** Durée maximale d'un timeout imposée par Discord. */
const MAX_TIMEOUT_MINUTES = 28 * 24 * 60;

const UNITS = [
  { id: "minutes", label: "minutes", factor: 1 },
  { id: "hours", label: "heures", factor: 60 },
  { id: "days", label: "jours", factor: 1440 },
] as const;

type UnitId = (typeof UNITS)[number]["id"];

function unitFor(minutes: number): UnitId {
  if (minutes % 1440 === 0) return "days";
  if (minutes % 60 === 0) return "hours";
  return "minutes";
}

function factorOf(unit: UnitId): number {
  return UNITS.find((candidate) => candidate.id === unit)?.factor ?? 1;
}

function clampMinutes(minutes: number): number {
  return Math.min(MAX_TIMEOUT_MINUTES, Math.max(1, minutes));
}

export function DurationInput({
  minutes,
  ariaLabel,
  onChange,
}: {
  minutes: number;
  ariaLabel: string;
  onChange: (minutes: number) => void;
}) {
  const [unit, setUnit] = useState<UnitId>(() => unitFor(minutes));
  const factor = factorOf(unit);
  const amount = Math.max(1, Math.round(minutes / factor));

  return (
    <span className="duration-input">
      <NumberInput
        value={amount}
        min={1}
        max={Math.floor(MAX_TIMEOUT_MINUTES / factor)}
        ariaLabel={ariaLabel}
        onChange={(next) => onChange(clampMinutes(next * factor))}
      />
      <select
        className="select select-compact"
        aria-label="Unité de durée"
        value={unit}
        onChange={(event) => {
          const nextUnit = event.target.value as UnitId;
          setUnit(nextUnit);
          onChange(clampMinutes(amount * factorOf(nextUnit)));
        }}
      >
        {UNITS.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.label}
          </option>
        ))}
      </select>
    </span>
  );
}
