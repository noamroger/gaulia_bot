import type { Dictionary } from "../../i18n/translate";

const adventure = {
  loadError: "Could not load the adventure settings.",

  where: {
    title: "Where the adventure is played",
    description:
      "Members can always play in a direct message with Gaulia: this only covers the channels of this server. It applies to everyone, administrators included.",
    module: {
      label: "Adventure module",
      hint: "Turned off, /adventure stops answering in every channel of the server.",
    },
    mode: {
      label: "Channel mode",
      hint: "The allowlist starts empty, so the adventure is barred everywhere until you allow a channel.",
      aria: "Adventure channel mode",
    },
    allowedLabel: "Allowed channels",
    blockedLabel: "Blocked channels",
    allowedHint: "Only these channels (and their threads) accept the adventure commands.",
    blockedHint:
      "These channels (and their threads) turn the adventure commands down; every other one accepts them.",
    add: "Add a channel...",
    emptyAllowlist: "No channel - adventure barred everywhere",
    emptyBlocklist: "No channel - adventure open everywhere",
    aria: "Add an adventure channel",
    result: "Result",
  },

  channelMode: {
    ALLOWLIST: "Allowlist - playable only in the chosen channels",
    BLOCKLIST: "Blocklist - playable everywhere except in the chosen channels",
  },

  summary: {
    disabled: "The module is off: the adventure is playable in no channel of this server.",
    allowlistEmpty: "No channel allowed: the adventure is playable in no channel of this server.",
    allowlist: {
      one: "The adventure is playable in {count} channel and its threads, nowhere else.",
      other: "The adventure is playable in {count} channels and their threads, nowhere else.",
    },
    blocklistEmpty: "The adventure is playable in every channel of the server.",
    blocklist: {
      one: "The adventure is playable everywhere, except in {count} channel and its threads.",
      other: "The adventure is playable everywhere, except in {count} channels and their threads.",
    },
  },

  about: {
    title: "About the module",
    description:
      "The adventure is a long haul role playing game: every member has a single adventurer, shared across all servers and direct messages.",
    progression: {
      label: "Progression",
      hint: "Energy caps how many explorations fit in a day, and echo shards (earned from quests and the weekly dungeon) move the story along. Finishing it takes more than a year of regular play.",
      value: "7 acts · 35 chapters",
    },
    commands: {
      label: "Commands",
      hint: "Everything runs through /adventure: tutorial, start, explore, story, quests, inventory, shop, forge, upgrade, trade, dungeon, leaderboard... Newcomers can run /adventure tutorial without a character.",
      value: "A single command",
    },
    trades: {
      label: "Player to player trades",
      hint: "Adventurers can trade items and gold from level 5 on. Story relics cannot be traded, and an upgrade stays with whoever paid for it. Offers follow the same channel rules as the rest of the module.",
      value: "Items and gold",
    },
  },

  admin: {
    itemKind: {
      EQUIPEMENT: "Gear",
      CONSOMMABLE: "Consumables",
      MATERIAU: "Materials",
      TRESOR: "Treasures",
      RELIQUE: "Relics",
    },

    class: {
      GUERRIER: "🛡️ Warrior",
      MAGE: "🔮 Mage",
      RODEUR: "🏹 Ranger",
    },

    intervention: {
      title: "Step into the game",
      description:
        "Leave a field empty to leave it alone. Values are deltas (a negative number takes away), except the level, which is set outright. Every intervention is written to the player's journal.",
      xp: { label: "Experience", hint: "Added as in game, levels go up." },
      gold: { label: "Gold", hint: "Negative to take away." },
      echoes: { label: "Echo shards", hint: "The story currency." },
      energy: { label: "Energy", hint: "Cap: {max}." },
      statPoints: { label: "Stat points", hint: "For the player to spend." },
      level: { label: "Level", hint: "Set outright (1 to {max})." },
      item: { label: "Item", none: "No item", notTradable: " (not tradable)" },
      quantity: { label: "Quantity", hint: "Negative to take out of the bag." },
      reason: { label: "Reason", placeholder: "Bug compensation, event..." },
      confirm:
        "Confirm the intervention: it applies right away and shows up in the player's journal.",
      apply: "Apply",
      applying: "Applying...",
    },

    sheet: {
      level: "Level",
      totalXp: "{value} XP in total",
      story: "Story",
      storyDone: "Story finished",
      actFallback: "Act {number}",
      chapterFallback: "chapter {number}",
      purse: "Purse",
      echoes: {
        one: "{value} echo shard",
        other: "{value} echo shards",
      },
      energy: "Energy",
      hp: "{value} HP",

      stats: {
        title: "Stats",
        class: "Class",
        attributes: "Might / Agility / Spirit",
        statPoints: "Points to spend",
        explorations: "Explorations",
        record: "Wins / Losses",
        dungeons: "Dungeons",
        streak: "Streak",
        streakValue: "{count} d (best {best})",
        upgrades: "Upgrades",
        trades: "Trades closed",
        achievements: "Achievements",
      },

      inventory: {
        title: "Inventory ({count})",
        empty: "Empty bag.",
        columnItem: "Item",
        columnQuantity: "Quantity",
        columnUpgrade: "Upgrade",
        columnState: "State",
        equipped: "Worn",
      },

      quests: {
        title: "Quests in progress",
        empty: "No quest batch recorded.",
        DAILY: "Daily",
        WEEKLY: "Weekly",
      },

      trades: {
        title: "Pending trades ({count})",
        empty: "No open offer.",
        versus: "for",
        nothing: "nothing",
        gold: "{value} gold",
      },

      logs: {
        title: "Journal",
        empty: "Nothing to report.",
      },
    },
  },
} satisfies Dictionary;

export type AdventureStrings = typeof adventure;

export default adventure;
