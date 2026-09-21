import type { Dictionary } from "../../i18n/translate";

const settings = {
  loadError: "Could not load this server's settings.",

  logs: {
    title: "Log channels",
    description: 'Where Gaulia posts its reports. Pick "Disabled" to post nothing.',
    disabled: "Disabled",
    moderation: {
      label: "Moderation log",
      hint: "Every sanction (ban, kick, timeout, warning) with its reason and who issued it.",
      aria: "Moderation log channel",
    },
    automod: {
      label: "Automod log",
      hint: "Messages deleted by the automod, and the sanctions that followed.",
      aria: "Automod log channel",
    },
  },

  sanctions: {
    title: "Sanctions",
    dm: {
      label: "Tell the member in a direct message",
      hint: "The sanctioned member gets the action and its reason by DM, if their DMs are open.",
    },
  },

  escalation: {
    title: "Automatic sanctions for warnings",
    description:
      "Once a member reaches a given number of active warnings, Gaulia applies that step's sanction on its own.",
    empty: "No step yet: warnings trigger no automatic sanction.",
    at: "At",
    warnings: "warnings:",
    warnCountAria: "Number of warnings",
    stepActionAria: "Sanction for this step",
    remove: "Remove",
    add: "Add a step",
    duplicate: "Two steps use the same number of warnings.",
    action: {
      timeout: "Timeout",
      kick: "Kick",
      ban: "Ban",
    },
  },

  sanction: {
    label: "Sanction",
    timeout: "Timeout length",
    type: {
      delete: "Delete the message",
      warn: "Delete and warn",
      timeout: "Delete and time out",
      kick: "Delete and kick",
      ban: "Delete and ban",
    },
  },

  duration: {
    unitAria: "Duration unit",
    minutes: "minutes",
    hours: "hours",
    days: "days",
  },

  channel: {
    missing: "Channel not found",
  },

  role: {
    missing: "Role not found",
  },

  picker: {
    unknown: "Not found",
    remove: "Remove {label}",
  },

  tags: {
    remove: "Remove {value}",
    full: "Limit reached",
    add: "Add",
  },

  saveBar: {
    unsaved: "Unsaved changes.",
    saved: "Changes saved.",
    saving: "Saving...",
  },
} satisfies Dictionary;

export type SettingsStrings = typeof settings;

export default settings;
