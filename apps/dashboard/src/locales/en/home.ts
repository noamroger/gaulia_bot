import type { Dictionary } from "../../i18n/translate";

const home = {
  meta: {
    title: "Gaulia - Discord bot for moderation, music and games",
    description:
      "Gaulia moderates, protects and livens up your Discord server: moderation, automod, music, blindtest and games, all tunable from a web dashboard.",
  },

  nav: {
    ariaLabel: "Main navigation",
    features: "Features",
    dashboard: "Dashboard",
  },

  hero: {
    eyebrow: "All-in-one Discord bot",
    titleStart: "Moderate, protect and",
    titleAccent: "liven up",
    titleEnd: "your Discord server",
    tagline:
      "Moderation, automod, music, blindtest and games in a single bot, set up in a few clicks from your browser.",
    addBot: "Add Gaulia to my server",
    manage: "Manage my servers",
  },

  preview: {
    channel: "blindtest",
    app: "APP",
    time: "Today at 9:04 PM",
    player: "Tom",
    round: "Round 3 / 10",
    hint: "Listen closely! The round ends in 18 seconds.",
    trackFound: "Title: found by",
    mention: "@Lea",
    artistPending: "Artist: still to find",
    skip: "Skip round",
    stop: "Stop",
    guess: "that's Daft Punk!",
  },

  stats: {
    ariaLabel: "Live stats",
    guilds: "servers",
    members: "members",
    commands: "commands over 30 days",
    online: "Gaulia is online",
    offline: "Gaulia is offline",
    status: "{state} · figures refreshed every minute",
    unavailable: "Stats are unavailable right now.",
    loading: "Loading stats...",
  },

  features: {
    eyebrow: "Features",
    title: "Everything your server needs",
    subtitle: "Every module is switched on and tuned from the dashboard.",

    moderation: {
      title: "Moderation",
      description:
        "Bans, kicks, timeouts and warnings, with a full sanction history, logs in the channel of your choice and automatic sanctions past a given number of warnings.",
    },
    automod: {
      title: "Automod",
      description:
        "Seven rules to block links, invites, banned words, mass mentions, caps, duplicate messages and flooding, each with its own sanction, on top of Discord's native AutoMod.",
    },
    music: {
      title: "Music",
      description:
        "Playback from SoundCloud and Spotify links, a queue, audio filters, a dedicated channel and a DJ role to keep playback under control.",
    },
    blindtest: {
      title: "Blindtest",
      description:
        "30 second clips to guess in your voice channel, ready to play categories and your own track lists.",
    },
    games: {
      title: "Games",
      description:
        "Connect 4, tic-tac-toe, hangman, Wordle, blackjack and minesweeper to liven up the server between two conversations.",
    },
    premium: {
      title: "Premium",
      description:
        "24/7 music and a longer queue, through a Discord subscription or with the credits you earn by voting for Gaulia on top.gg.",
    },
  },

  steps: {
    eyebrow: "Getting started",
    title: "Ready in three steps",

    add: {
      title: "Add Gaulia",
      description:
        "Invite the bot to your server in one click, with only the permissions it actually needs.",
    },
    signIn: {
      title: "Sign in",
      description:
        "Open the dashboard with your Discord account: the servers you manage are already there.",
    },
    configure: {
      title: "Configure",
      description: "Pick your log channels, your automod rules, music and blindtest, then save.",
    },
  },

  cta: {
    title: "Ready to try Gaulia?",
    description:
      "Add the bot to your server, then set it up from the dashboard with your Discord account.",
    addBot: "Add Gaulia",
    vote: "Vote on top.gg",
  },
} satisfies Dictionary;

export type HomeStrings = typeof home;

export default home;
