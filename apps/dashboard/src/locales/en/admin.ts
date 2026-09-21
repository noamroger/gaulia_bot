import type { Dictionary } from "../../i18n/translate";

const admin = {
  layout: {
    title: "Admin panel",
    tabsLabel: "Admin panel sections",
    tabs: {
      stats: "Statistics",
      servers: "Servers",
      credits: "Credits",
      adventure: "Adventure",
      data: "Data",
    },
  },

  stats: {
    rangeLabel: "Period",
    rangeOption: "{days} days",
    autoRefresh: "Refreshed automatically every {seconds} s",
    loadFailed: "The statistics could not be loaded.",

    tiles: {
      guilds: "Servers",
      members: "Members",
      commands: "Commands",
      commandsHint: "over {days} days · {total} all time",
      shards: "Shards online",
      shardsValue: "{online} / {total}",
      ping: "Average ping",
      players: "Active music players",
    },

    scope: {
      all: "all categories",
      none: "no category selected",
    },

    daily: {
      title: "Commands per day",
      subtitle: "Last {days} days, {scope}",
      day: "Day",
      count: "Commands",
    },

    top: {
      title: "Most used commands",
      subtitle: "Top 10 over {days} days, {scope}",
      empty: "No command was used over this period.",
    },

    categories: {
      groupLabel: "Command categories",
      label: "Categories",
      showAll: "Show all",
      names: {
        general: "General",
        moderation: "Moderation",
        automod: "Automod",
        music: "Music",
        fun: "Fun",
        premium: "Premium",
        other: "Other",
      },
    },

    shards: {
      title: "Shards",
      empty: "No shard has sent a heartbeat yet.",
      name: "Shard #{id}",
      online: "Online",
      offline: "Offline",
      guilds: "Servers",
      members: "Members",
      ping: "Ping",
      memory: "Memory",
      players: "Active players",
      uptime: "Uptime",
      lastHeartbeat: "Last heartbeat {when}",
    },
  },

  units: {
    milliseconds: "{value} ms",
    megabytes: "{value} MB",
  },

  charts: {
    showData: "Show the data",

    daily: {
      ariaLabel: "Commands used per day over {days} days",
      tooltip: "commands · {day}",
    },

    topCommands: {
      uses: {
        one: "{value} use · {share}% of the total",
        other: "{value} uses · {share}% of the total",
      },
      row: "{command}: {summary}",
    },

    history: {
      ariaLabel: "{title} over {days} days",
      subtitle: "{scope} · {days} days · {step} steps",
      stepMinutes: "{value} min",
      stepHours: "{value} h",
      period: "Period",
      noValue: "No data",
      empty: "No history yet: it fills up with every shard heartbeat.",

      guilds: {
        title: "Servers",
        subtitle: "All shards combined",
        column: "Servers",
        value: { one: "{value} server", other: "{value} servers" },
      },
      members: {
        title: "Users",
        subtitle: "Members across every server",
        column: "Members",
        value: { one: "{value} member", other: "{value} members" },
      },
      ping: {
        title: "Ping",
        subtitle: "Average across shards",
        column: "Ping",
      },
    },
  },

  servers: {
    searchPlaceholder: "Search by name or ID...",
    searchLabel: "Search a server by name or ID",
    filtersButton: "Filters",
    filtersButtonCount: "Filters ({count})",
    sortBy: "Sort by",
    orderLabel: "Sort direction",
    ascending: "Ascending",
    descending: "Descending",
    clearAll: "Clear all",
    count: {
      one: "{shown} of {total} server",
      other: "{shown} of {total} servers",
    },

    sort: {
      createdAt: "Bot joined",
      updatedAt: "Last change",
      name: "Name",
      id: "ID",
      members: "Members",
      language: "Language",
      premium: "Premium subscription",
      subscriptionEnd: "Subscription end",
      creditsEnd: "Gifted premium end",
      cases: "Cases",
      warns: "Warnings",
      playlists: "Blindtest playlists",
    },

    /** "auto" means the bot follows the Discord locale of the server. */
    language: {
      auto: "Automatic (Discord)",
      en: "English",
      fr: "French",
    },

    premiumFilter: {
      all: "All",
      active: "Premium active",
      none: "Without premium",
      subscription: "Discord subscription",
      credits: "Gifted for credits",
      expiring: "Ends within 7 days",
    },

    filter: {
      premium: "Premium",
      language: "Language",
      languageAll: "All",
      members: "Members",
      membersMin: "Minimum member count",
      membersMax: "Maximum member count",
      minPlaceholder: "min",
      maxPlaceholder: "max",
      created: "Bot joined",
      createdFrom: "Bot joined on or after",
      createdTo: "Bot joined on or before",
      updated: "Last change",
      updatedFrom: "Last change on or after",
      updatedTo: "Last change on or before",
      adventure: "Adventure module",
      automod: "Automod settings",
      moderation: "Moderation settings",
      music: "Music settings",
      modLog: "Moderation log channel",
      automodLog: "Automod log channel",
      djRole: "DJ role",
      musicChannel: "Music channel",
      funChannels: "Fun module channels",
      playlists: "Blindtest playlists",
      cases: "Cases",
      warns: "Warnings",
      icon: "Server icon",

      options: {
        all: "All",
        adventureEnabled: "Open",
        adventureDisabled: "Closed",
        adventureNever: "Never set",
        configured: "Configured",
        untouched: "Never touched",
        channelSet: "Set",
        channelUnset: "Not set",
        funRestricted: "Restricted",
        funEveryChannel: "Every channel",
        playlistsSome: "At least one",
        playlistsNone: "None",
        casesSome: "At least one",
        casesNone: "None",
        warnsSome: "At least one",
        warnsNone: "None",
        iconCustom: "Custom",
        iconDefault: "Default",
      },
    },

    badges: {
      automod: "Automod",
      moderation: "Moderation",
      music: "Music",
      adventure: "Adventure",
      modLog: "Mod logs",
      automodLog: "Automod logs",
      djRole: "DJ role",
      musicChannel: "Music channel",
      fun: "Fun ({count})",
      more: "+{count}",
    },

    premiumCell: {
      active: "Active",
      inactive: "Inactive",
      gifted: "Gifted",
      subscription: "Subscription",
      until: "until {date}",
    },

    loadFailed: "The server list could not be loaded.",
    empty: "No server.",
    noMatch: "No server matches these filters.",

    table: {
      server: "Server",
      id: "ID",
      members: "Members",
      language: "Language",
      premium: "Premium",
      settings: "Settings",
      cases: "Cases",
      warns: "Warns",
      joined: "Joined",
      unnamed: "Unnamed",
      openSettings: "Settings",
      grantPremium: "Grant premium",
      revokePremium: "Revoke premium",
    },

    pagination: {
      perPage: "Per page",
      page: "Page {page} of {pageCount}",
      previous: "Previous",
      next: "Next",
    },
  },

  credits: {
    searchPlaceholder: "Search by username or ID...",
    searchLabel: "Search a user by username or ID",
    adjust: "Add / remove credits",
    accounts: {
      one: "{shown} / {total} account",
      other: "{shown} / {total} accounts",
    },
    circulation: "{credits} credits in circulation",

    dialog: {
      title: "Add or remove credits",
      description:
        "Enter the user's Discord ID and the change to apply: a positive number adds credits, a negative one removes them. The account is created if it does not exist yet.",
      userId: "Discord ID",
      userIdPlaceholder: "123456789012345678",
      amount: "Credits (+ / -)",
      amountPlaceholder: "150",
      reason: "Reason (optional)",
      reasonPlaceholder: "Compensation, giveaway...",
      submit: "Continue",
    },

    invalidId: "A Discord ID is 17 to 20 digits long.",
    empty: "Nobody owns credits yet.",
    noMatch: "No account matches “{query}”.",

    table: {
      user: "User",
      id: "ID",
      credits: "Credits",
      votes: "Votes",
      lastVote: "Last vote",
    },

    edit: "Edit",
    saving: "Saving...",
    confirm: "Confirm {amount}",
    balanceSet: {
      one: "Balance of {userId} set to {amount} credit.",
      other: "Balance of {userId} set to {amount} credits.",
    },
    deltaApplied: {
      one: "{amount} credit for {userId} - new balance: {balance}.",
      other: "{amount} credits for {userId} - new balance: {balance}.",
    },
    pendingEdit: {
      one: "The balance of {userId} will become {amount} credit. The change is recorded in the account history.",
      other:
        "The balance of {userId} will become {amount} credits. The change is recorded in the account history.",
    },
  },

  adventure: {
    tiles: {
      players: "Adventurers",
      playersHint: "characters created",
      finished: "Stories finished",
      finishedHint: "out of {chapters} chapters",
      topLevel: "Highest level",
      topLevelHint: "maximum: {level}",
    },

    searchPlaceholder: "Search a player (username or ID)",
    searchLabel: "Search a player by username or ID",
    empty: "No adventurer yet.",

    table: {
      player: "Player",
      level: "Level",
      story: "Story",
      gold: "Coins",
      echoes: "Echoes",
      lastPlayed: "Last played",
    },

    finished: "Finished",
    progress: "Act {act} · chapter {chapter}",
    open: "Open",
    close: "Close",
    sheetTitle: "{name}'s run",
    sheetLoading: "Loading the character sheet...",
    interventionApplied: "Intervention applied and written to the player's log.",
  },

  data: {
    title: "Data erasure",
    description:
      "To handle an erasure request: enter the Discord ID of the server or of the user, check what will be deleted, then confirm. This cannot be undone.",

    targetLabel: "ID type",
    guild: "Server",
    user: "User",
    guildId: "Server ID",
    userId: "User ID",
    searching: "Searching...",
    search: "Search",
    invalidId: "A Discord ID is 17 to 20 digits long.",

    yes: "Yes",
    no: "No",

    guildSummary: {
      configured: "Server configuration",
      none: "None",
      moderationCases: "Moderation cases",
      warns: "Warnings",
      automodConfig: "Automod configuration",
      musicSettings: "Music settings",
      blindtestPlaylists: "Blindtest playlists",
      adventureSettings: "Adventure settings",
      premiumEntitlements: "Cached premium entitlements",
    },

    userSummary: {
      casesAsTarget: "Sanctions received (deleted)",
      warnsAsTarget: "Warnings received (deleted)",
      casesAsModerator: "Sanctions issued as a moderator (anonymized)",
      warnsAsModerator: "Warnings issued as a moderator (anonymized)",
      premiumEntitlements: "Cached premium entitlements (deleted)",
      creditBalance: "Credits (deleted along with the account)",
      topggVotes: "Recorded top.gg votes (deleted)",
      adventureCharacter: "Adventure character (deleted along with its progress)",
      adventureNone: "None",
      adventureLevel: "Level {level}",
    },

    guildWarning:
      "Every piece of data about this server will be deleted. If Gaulia is still on it, a blank configuration is created again automatically.",
    userWarning:
      "Sanctions and warnings received will be deleted; those issued as a moderator stay in the servers' history, without their identity.",
    premiumNote:
      "A premium subscription still active on Discord's side is synced again the next time the bot restarts.",

    deleting: "Deleting...",
    confirmDelete: "Confirm the permanent deletion",
    delete: "Delete this data",
    done: "Data deleted for ID {id}.",
  },
} satisfies Dictionary;

export type AdminStrings = typeof admin;

export default admin;
