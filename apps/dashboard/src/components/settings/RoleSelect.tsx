"use client";

import { useTranslation } from "@/i18n";
import type { GuildRoleOption } from "@/lib/types";

export function RoleSelect({
  value,
  roles,
  emptyLabel,
  ariaLabel,
  onChange,
}: {
  value: string | null;
  roles: GuildRoleOption[];
  emptyLabel: string;
  ariaLabel: string;
  onChange: (roleId: string | null) => void;
}) {
  const t = useTranslation();
  const missing = value !== null && !roles.some((role) => role.id === value);

  return (
    <select
      className="select"
      aria-label={ariaLabel}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value || null)}
    >
      <option value="">{emptyLabel}</option>
      {missing && <option value={value ?? ""}>{t("settings.role.missing")}</option>}
      {roles.map((role) => (
        <option key={role.id} value={role.id}>
          @{role.name}
        </option>
      ))}
    </select>
  );
}
