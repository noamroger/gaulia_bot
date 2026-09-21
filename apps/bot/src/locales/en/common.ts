import type { TranslationModule } from "../../i18n/catalog";

const common = {
  error: {
    title: "Oops",
    internal: "Something went wrong on our end.",
  },

  guard: {
    guildOnly: {
      title: "Server required",
      description: "This command only works inside a server.",
    },
    permission: {
      title: "Missing permission",
      description: "You are not allowed to use this command.",
    },
    cooldown: {
      title: "Slow down",
      description: "Try again in {seconds}s.",
    },
    blindtestRunning:
      "A blindtest is running on this server: music commands come back once the game is over.",
  },

  hierarchy: {
    self: "You cannot do this to yourself.",
    targetOwner: "The server owner cannot be moderated.",
    targetHigher: "This member has a role equal to or above yours.",
    botTargetOwner: "I cannot act on the server owner.",
    botRoleTooLow: "My role sits too low in the hierarchy to act on this member.",
  },

  permissionLevel: {
    owner: "Bot owner",
    administrator: "Administrator",
    moderator: "Moderator",
    everyone: "Everyone",
  },

  premium: {
    featureTitle: "Premium feature",
    featureDescription: "**{feature}** is reserved for servers with **Gaulia Premium**.",
    invitationTitle: "Enjoy Gaulia Premium!",
    invitationDescription:
      "This server does not have **Gaulia Premium**. Go premium for 24/7 playback, audio filters, a longer queue and advanced automod rules.",
  },

  duration: {
    invalid: "Invalid duration format. Valid examples: `30s`, `10m`, `2h`, `1d`.",
    day: "{count}d",
    hour: "{count}h",
    minute: "{count}m",
    second: "{count}s",
    zero: "0s",
  },

  language: {
    auto: "Automatic (Discord language)",
    en: "English",
    fr: "French",
  },
} satisfies TranslationModule;

export type CommonStrings = typeof common;

export default common;
