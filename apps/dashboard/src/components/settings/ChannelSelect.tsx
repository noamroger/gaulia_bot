import type { GuildChannelOption } from "@/lib/types";

function renderOption(channel: GuildChannelOption) {
  return (
    <option key={channel.id} value={channel.id}>
      #{channel.name}
    </option>
  );
}

export function ChannelSelect({
  value,
  channels,
  emptyLabel,
  ariaLabel,
  onChange,
}: {
  value: string | null;
  channels: GuildChannelOption[];
  emptyLabel: string;
  ariaLabel: string;
  onChange: (channelId: string | null) => void;
}) {
  const uncategorized = channels.filter((channel) => channel.parentName === null);
  const categories = [
    ...new Set(channels.flatMap((channel) => (channel.parentName ? [channel.parentName] : []))),
  ];
  const missing = value !== null && !channels.some((channel) => channel.id === value);

  return (
    <select
      className="select"
      aria-label={ariaLabel}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value || null)}
    >
      <option value="">{emptyLabel}</option>
      {missing && <option value={value ?? ""}>Salon introuvable</option>}
      {uncategorized.map(renderOption)}
      {categories.map((category) => (
        <optgroup key={category} label={category}>
          {channels.filter((channel) => channel.parentName === category).map(renderOption)}
        </optgroup>
      ))}
    </select>
  );
}
