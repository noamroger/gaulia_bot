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
    manage: "Manage",
    add: "Invite",
  },

  panel: {
    back: "All servers",
    sectionsLabel: "Server sections",
  },

  sections: {
    settings: "Moderation logs, sanction notices and the warning ladder.",
    automod: "Filters that check members' messages and sanction them automatically.",
    music: "Who can use the music commands, default playback and the blindtest.",
    fun: "Where the games and the other fun commands answer.",
    adventure: "Where the adventure can be played on this server.",
    premium: "Premium status of the server and redeeming your credits.",
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
