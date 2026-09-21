import type { Dictionary } from "../../i18n/translate";

const premium = {
  loadError: "Could not load the premium status.",

  status: {
    title: "Premium status",
    active: "Active",
    inactive: "Inactive",
    fromSubscription: "Discord subscription",
    fromCredits: "Credits",

    offerBefore: "Use",
    offerCommand: "/premium upgrade",
    offerAfter: "on Discord to subscribe, or redeem your credits below.",

    subscriptionSource: "Paid on Discord directly, with your usual payment method.",
    renewsAt: "Next renewal on {date}.",
    renewsUnknown: "Renews automatically: Discord has not announced a date yet.",
    creditsSource: "Given in exchange for credits earned by voting for Gaulia on top.gg.",
    expiresAt: "Expires on {date}, with no automatic renewal.",
    noExpiry: "No end date recorded.",
    bothSources:
      "Gifted premium also runs until {date}. The subscription wins: you are not paying twice.",
  },

  /** Wording of the credit offers, keyed by the id the API sends. */
  offer: {
    week: { label: "One week of premium", duration: "7 days" },
    month: { label: "One month of premium", duration: "30 days" },
  },

  redeem: {
    title: "Premium in exchange for credits",
    balanceBefore: "You have",
    balanceValue: {
      one: "{value} credit",
      other: "{value} credits",
    },
    balanceAfter:
      "Each vote for Gaulia on top.gg earns 10, and you can vote every 12 hours. Redeemed time stacks on top of gifted premium already running.",
    subscribed:
      "This server already has a paid subscription: redeeming credits would burn them alongside it without adding anything.",
    cost: {
      one: "{value} credit",
      other: "{value} credits",
    },
    action: "Redeem",
    missing: "{value} credits short",
  },

  confirm: {
    aria: "Confirm the exchange",
    before: "Redeem",
    credits: {
      one: "{value} credit",
      other: "{value} credits",
    },
    middle: "for",
    after:
      "of premium on this server? If the server subscribes before that period runs out, the unused share is credited back to you.",
    submit: "Confirm the exchange",
    pending: "Redeeming...",
  },

  success: {
    one: "Premium active until {date}. {value} credit left on your account.",
    other: "Premium active until {date}. {value} credits left on your account.",
  },
  userCredits: {
    loading: "Loading credits...",
    label: "My credits",
    noVote: "No vote recorded yet.",
    votes: { one: "{value} vote", other: "{value} votes" },
    earned: {
      one: "{value} credit earned in total",
      other: "{value} credits earned in total",
    },
    vote: "Vote",
    explainerBefore:
      "Every vote on top.gg earns you {credits} credits (one vote every 12 hours). Redeem them in the",
    premiumTab: "Premium",
    explainerAfter: "tab of a server:",
    offer: "{cost} credits for {duration}",
    history: "Credit history",

    table: {
      date: "Date",
      operation: "Operation",
      amount: "Amount",
      balance: "Balance",
    },

    transaction: {
      VOTE: "top.gg vote",
      PREMIUM_REDEEM: "Premium redeem",
      ADMIN_ADJUST: "Administrator adjustment",
      PREMIUM_REFUND: "Premium refund",
    },
  },
} satisfies Dictionary;

export type PremiumStrings = typeof premium;

export default premium;
