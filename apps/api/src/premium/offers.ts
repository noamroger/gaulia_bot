const DAY_MS = 24 * 60 * 60_000;

export type PremiumOfferId = "week" | "month";

export interface PremiumOffer {
  id: PremiumOfferId;
  label: string;
  /** Coût en crédits (10 crédits par vote sur top.gg). */
  cost: number;
  durationMs: number;
  durationLabel: string;
}

/** Offres d'échange « crédits → premium offert », partagées par l'API et le dashboard. */
export const PREMIUM_OFFERS: PremiumOffer[] = [
  {
    id: "week",
    label: "Une semaine de premium",
    cost: 150,
    durationMs: 7 * DAY_MS,
    durationLabel: "7 jours",
  },
  {
    id: "month",
    label: "Un mois de premium",
    cost: 500,
    durationMs: 30 * DAY_MS,
    durationLabel: "30 jours",
  },
];

export function findPremiumOffer(id: string): PremiumOffer | undefined {
  return PREMIUM_OFFERS.find((offer) => offer.id === id);
}
