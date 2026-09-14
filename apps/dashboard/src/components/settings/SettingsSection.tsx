import type { ReactNode } from "react";

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="card settings-section">
      <h2 className="card-title">{title}</h2>
      {description && <p className="card-subtitle">{description}</p>}
      {children}
    </section>
  );
}

export function SettingRow({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="setting-row">
      <div className="setting-row-text">
        <strong>{label}</strong>
        {hint && <span className="setting-hint">{hint}</span>}
      </div>
      <div className="setting-row-control">{children}</div>
    </div>
  );
}
