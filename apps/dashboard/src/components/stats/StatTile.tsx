export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card stat-tile">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}
