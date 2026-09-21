import type { Dictionary } from "../../i18n/translate";

const nav = {
  language: {
    switchTo: "Switch to {language}",
  },

  top: {
    admin: "Admin",
    credits: "{count} credits",
    creditsTitle: "Credits earned by voting on top.gg",
    creditsMenu: "{count} credit(s)",
    accountMenu: "Account menu",
    myServers: "My servers",
    logout: "Log out",
  },

  footer: {
    tagline:
      "Discord bot: moderation, automod, music, blindtest, games and a long running adventure, all of it tunable server by server from this dashboard.",
    version: "Version {version}",
    maintainedBy: "built and maintained by",
    rights: "© {year} Gaulia · not affiliated with Discord Inc.",

    bot: "The bot",
    addBot: "Add Gaulia",
    vote: "Vote on top.gg",
    appDirectory: "Discord App Directory",
    support: "Support server",

    dashboard: "Dashboard",
    home: "Home",
    myServers: "My servers",

    resources: "Resources",
    contact: "Contact us",
    myData: "My data",
    privacy: "Privacy policy",
  },
} satisfies Dictionary;

export type NavStrings = typeof nav;

export default nav;
