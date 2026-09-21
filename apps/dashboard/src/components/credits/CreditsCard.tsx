"use client";

import { useLocale, useTranslation } from "@/i18n";
import { formatDateTime, formatNumber } from "@/lib/format";
import { offerDuration } from "@/lib/premiumOffers";
import { useCredits } from "@/lib/useCredits";

/**
 * Credit balance of the signed in user, shown on the "My servers" page: how many they have, how
 * to earn more (top.gg vote) and what they can spend them on (gifted premium).
 */
export function CreditsCard() {
  const { credits, loading } = useCredits();
  const t = useTranslation();
  const locale = useLocale();

  if (loading) return <p className="text-muted">{t("premium.userCredits.loading")}</p>;
  // Balance unavailable (API unreachable): the page stays usable without this card.
  if (!credits) return null;

  const voteSummary = [
    t("premium.userCredits.votes", {
      count: credits.voteCount,
      value: formatNumber(credits.voteCount, locale),
    }),
    t("premium.userCredits.earned", {
      count: credits.totalEarned,
      value: formatNumber(credits.totalEarned, locale),
    }),
  ].join(" · ");

  return (
    <section className="card credits-card">
      <div className="credits-header">
        <div>
          <p className="stat-label">{t("premium.userCredits.label")}</p>
          <p className="credits-balance">{formatNumber(credits.balance, locale)}</p>
          <p className="stat-hint">
            {credits.voteCount === 0 ? t("premium.userCredits.noVote") : voteSummary}
          </p>
        </div>
        {/* `/vote` is a dashboard redirect to the bot's top.gg page (next.config.js). */}
        <a className="button-primary" href="/vote" target="_blank" rel="noopener noreferrer">
          {t("premium.userCredits.vote")}
        </a>
      </div>

      <p className="text-muted" style={{ fontSize: 14 }}>
        {t("premium.userCredits.explainerBefore", { credits: credits.creditsPerVote })}{" "}
        <strong>{t("premium.userCredits.premiumTab")}</strong>{" "}
        {t("premium.userCredits.explainerAfter")}{" "}
        {credits.offers.map((offer, index) => (
          <span key={offer.id}>
            {index > 0 && ", "}
            {t("premium.userCredits.offer", {
              cost: formatNumber(offer.cost, locale),
              duration: offerDuration(offer, t),
            })}
          </span>
        ))}
        .
      </p>

      {credits.transactions.length > 0 && (
        <details className="data-table-toggle">
          <summary>{t("premium.userCredits.history")}</summary>
          <div style={{ overflowX: "auto", maxHeight: 260 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t("premium.userCredits.table.date")}</th>
                  <th>{t("premium.userCredits.table.operation")}</th>
                  <th>{t("premium.userCredits.table.amount")}</th>
                  <th>{t("premium.userCredits.table.balance")}</th>
                </tr>
              </thead>
              <tbody>
                {credits.transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDateTime(transaction.createdAt, locale)}</td>
                    <td>
                      {transaction.reason ?? t(`admin.userCredits.transaction.${transaction.type}`)}
                    </td>
                    <td
                      className={`numeric ${transaction.amount < 0 ? "amount-down" : "amount-up"}`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {formatNumber(transaction.amount, locale)}
                    </td>
                    <td className="numeric">{formatNumber(transaction.balanceAfter, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
