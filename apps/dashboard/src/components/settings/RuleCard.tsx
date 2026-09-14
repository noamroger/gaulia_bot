import type { ReactNode } from "react";

import { Toggle } from "@/components/Toggle";

export function RuleCard({
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: ReactNode;
}) {
  return (
    <section className={`card rule-card${enabled ? "" : " is-disabled"}`}>
      <div className="rule-card-header">
        <div>
          <h3 className="card-title">{title}</h3>
          <span className="setting-hint">{description}</span>
        </div>
        <Toggle checked={enabled} onChange={onToggle} />
      </div>
      {enabled && <div className="rule-card-body">{children}</div>}
    </section>
  );
}
