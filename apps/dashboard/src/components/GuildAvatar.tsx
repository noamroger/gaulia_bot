import { guildIconUrl } from "@/lib/discordCdn";
import type { ManageableGuild } from "@/lib/types";

/** Server icon, or its first two letters when it has none. */
export function GuildAvatar({
  guild,
  className = "",
}: {
  guild: Pick<ManageableGuild, "id" | "name" | "icon">;
  className?: string;
}) {
  const icon = guildIconUrl(guild.id, guild.icon);
  return (
    <span className={`guild-avatar ${className}`.trim()} aria-hidden="true">
      {icon ? <img src={icon} alt="" /> : guild.name.slice(0, 2).toUpperCase()}
    </span>
  );
}
