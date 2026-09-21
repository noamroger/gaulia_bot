import type { Dictionary } from "../../i18n/translate";

const dashboard = {
  guilds: {
    title: "Your servers",
    subtitle: "Pick a server to manage its configuration.",
    empty: "Gaulia is not on any of the servers you manage. Invite it from the list below.",
    invitableTitle: "Servers to invite it to",
    invitableSubtitle:
      "You manage these servers, but Gaulia is not on them yet. Click one to invite it.",
    invite: "Invite Gaulia to {guild}",
  },

  tabs: {
    label: "Server sections",
    settings: "Settings",
    automod: "Automod",
    music: "Music",
    fun: "Fun",
    adventure: "Adventure",
    premium: "Premium",
  },
} satisfies Dictionary;

export type DashboardStrings = typeof dashboard;

export default dashboard;
