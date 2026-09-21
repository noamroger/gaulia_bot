import type { Translator } from "@/i18n";
import type { PremiumOffer } from "@/lib/types";

/**
 * The API sends an English label next to each offer id. The wording belongs to the reader, so it
 * comes from the catalog whenever the id is known, and the API label only covers a new offer the
 * site does not know yet.
 */
export function offerLabel(offer: PremiumOffer, t: Translator): string {
  const key = `premium.offer.${offer.id}.label`;
  return t.has(key) ? t(key) : offer.label;
}

export function offerDuration(offer: PremiumOffer, t: Translator): string {
  const key = `premium.offer.${offer.id}.duration`;
  return t.has(key) ? t(key) : offer.durationLabel;
}
