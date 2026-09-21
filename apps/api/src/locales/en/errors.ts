import type { Dictionary } from "../../i18n/translate";

const errors = {
  common: {
    internal: "Something went wrong on our side.",
    badRequest: "Invalid request.",
    notFound: "Resource not found.",
  },
  auth: {
    required: "You are not signed in.",
  },
  validation: {
    settings: "Invalid settings.",
    parameters: "Invalid parameters.",
    body: "Invalid request body.",
    id: "Invalid id.",
  },
  guild: {
    notManaged: "You do not manage this server.",
    botMissing: "Gaulia has no access to this server.",
    unknownChannelOrRole: "No such channel or role on this server.",
    invalid: "Invalid server.",
  },
  blindtest: {
    invalidName: "Invalid list name.",
    tooManyLists: "A server can hold {max} lists at most.",
    nameTaken: "A list already goes by that name.",
    listNotFound: "List not found.",
    invalidList: "Invalid list.",
    spotifyLink: "Paste the link to a Spotify playlist, album or track.",
    importRateLimited: "Too many imports, try again in a minute.",
    spotifyUnreadable: "This Spotify link cannot be read. Make sure it is public.",
  },
  premium: {
    unknownOffer: "Unknown offer.",
    subscriptionActive:
      "This server already has an active Gaulia Premium subscription: your credits would be spent for nothing. Try again once the subscription ends.",
    notEnoughCredits: "Not enough credits: {cost} needed, {balance} available.",
  },
  contact: {
    unavailable: "Sending messages is unavailable right now.",
    missingEmail:
      "Your Discord address is not available. Sign in again to share it, or check the address on your Discord account.",
    invalidForm: "Invalid form.",
    invalidSubject: "Unknown subject.",
    invalidGuildId: "Invalid server id.",
    messageTooShort: "Message too short.",
    messageTooLong: "Message too long.",
    rateLimited: "Too many messages sent. Try again in a few minutes.",
  },
  data: {
    confirmationMissing: "Confirmation missing: send back the word DELETE.",
  },
  admin: {
    ownersOnly: "Reserved for the bot owners.",
  },
  adventure: {
    noCharacter: "This player has no adventurer.",
    unknownItem: "Unknown item in the catalogue.",
  },
} satisfies Dictionary;

export type ErrorsStrings = typeof errors;

export default errors;
