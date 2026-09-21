const DAY_MS = 24 * 60 * 60_000;

export type PremiumOfferId = "week" | "month";

export interface PremiumOffer {
  id: PremiumOfferId;
  /** English label, kept as a fallback: the dashboard shows its own wording, keyed by `id`. */
  label: string;
  /** Cost in credits (10 credits per top.gg vote). */
  cost: number;
  durationMs: number;
  durationLabel: string;
}

/** Credits to gifted premium exchange rates, shared by the API and the dashboard. */
export const PREMIUM_OFFERS: PremiumOffer[] = [
  {
    id: "week",
    label: "One week of premium",
    cost: 150,
    durationMs: 7 * DAY_MS,
    durationLabel: "7 days",
  },
  {
    id: "month",
    label: "One month of premium",
    cost: 500,
    durationMs: 30 * DAY_MS,
    durationLabel: "30 days",
  },
];

export function findPremiumOffer(id: string): PremiumOffer | undefined {
  return PREMIUM_OFFERS.find((offer) => offer.id === id);
}
