"use client";

import { useLocale, useTranslation } from "@/i18n";
import { formatNumber } from "@/lib/format";

export interface CommandCount {
  commandName: string;
  count: number;
}

export function TopCommandsChart({ commands, total }: { commands: CommandCount[]; total: number }) {
  const t = useTranslation();
  const locale = useLocale();
  const max = Math.max(1, ...commands.map((command) => command.count));

  return (
    <ul className="bar-list">
      {commands.map((command) => {
        const share = total > 0 ? Math.round((command.count / total) * 100) : 0;
        const summary = t("admin.charts.topCommands.uses", {
          count: command.count,
          value: formatNumber(command.count, locale),
          share,
        });
        return (
          <li
            key={command.commandName}
            className="bar-row"
            tabIndex={0}
            aria-label={t("admin.charts.topCommands.row", {
              command: command.commandName,
              summary,
            })}
          >
            <span className="bar-label">{command.commandName}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${(command.count / max) * 100}%` }} />
            </span>
            <span className="bar-value">{formatNumber(command.count, locale)}</span>
            <span className="bar-tooltip" role="tooltip">
              {summary}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
