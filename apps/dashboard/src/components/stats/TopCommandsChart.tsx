import { formatNumber } from "@/lib/format";

export interface CommandCount {
  commandName: string;
  count: number;
}

export function TopCommandsChart({ commands, total }: { commands: CommandCount[]; total: number }) {
  const max = Math.max(1, ...commands.map((command) => command.count));

  return (
    <ul className="bar-list">
      {commands.map((command) => {
        const share = total > 0 ? Math.round((command.count / total) * 100) : 0;
        const summary = `${formatNumber(command.count)} utilisations · ${share} % du total`;
        return (
          <li
            key={command.commandName}
            className="bar-row"
            tabIndex={0}
            aria-label={`${command.commandName} : ${summary}`}
          >
            <span className="bar-label">{command.commandName}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${(command.count / max) * 100}%` }} />
            </span>
            <span className="bar-value">{formatNumber(command.count)}</span>
            <span className="bar-tooltip" role="tooltip">
              {summary}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
