import type { Dictionary } from "../../i18n/translate";

const automod = {
  loadError: "Could not load this server's automod.",

  intro: {
    before:
      "Every rule carries its own sanction. They come on top of Discord's native AutoMod rules, which you create with",
    command: "/automod setup",
    after: ".",
  },

  exemptions: {
    title: "Exemptions",
    description: "Members and channels the automod never checks.",
    staff: {
      label: "Skip the moderation team",
      hint: 'Members holding the "Manage Messages" permission.',
    },
    channels: {
      label: "Ignored channels",
      add: "Add a channel...",
      empty: "No ignored channel",
      aria: "Add an ignored channel",
    },
    roles: {
      label: "Ignored roles",
      add: "Add a role...",
      empty: "No ignored role",
      aria: "Add an ignored role",
    },
  },

  links: {
    title: "Links",
    description: "Filters links by domain name.",
    modeAria: "Link filter mode",
    blocklist: "Blocklist",
    allowlist: "Allowlist",
    blocklistHint: "Only links to these domains are sanctioned.",
    allowlistEmptyHint: "Empty list: every link will be sanctioned.",
    allowlistHint: "Every link is sanctioned, except those pointing to these domains.",
    subdomains: "Subdomains are included.",
    placeholder: "example.com",
    addAria: "Add a domain",
    invalid: '"{domain}" is not a valid domain name.',
  },

  invites: {
    title: "Discord invites",
    description: "Sanctions invites to other Discord servers.",
    hint: "Invite codes that stay allowed, your own server's for instance.",
    placeholder: "Invite code (e.g. gaulia)",
    addAria: "Add an allowed invite code",
  },

  badWords: {
    title: "Banned words",
    description: "Sanctions messages holding a banned word (whole word, case insensitive).",
    placeholder: "Word or phrase",
    addAria: "Add a banned word",
  },

  mentions: {
    title: "Mass mentions",
    description: "Sanctions messages that mention too many members or roles.",
    max: "Maximum mentions per message",
  },

  caps: {
    title: "Capitals",
    description: "Sanctions messages written mostly in capitals.",
    percent: "Share of capitals (%)",
    percentAria: "Share of capitals as a percentage",
    minLength: "Starting from (letters)",
    minLengthAria: "Minimum number of letters",
  },

  duplicates: {
    title: "Repeated messages",
    description: "Sanctions a member sending the same message several times in a row.",
    max: "Repeats before a sanction",
  },

  flood: {
    title: "Flood",
    description: "Sanctions a member sending too many messages in a short time.",
    messages: "Messages",
    messagesAria: "Number of messages",
    seconds: "Within (seconds)",
    secondsAria: "Window in seconds",
  },
} satisfies Dictionary;

export type AutomodStrings = typeof automod;

export default automod;
