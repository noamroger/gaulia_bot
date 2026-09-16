"use client";

import { formatDateTime, formatNumber } from "@/lib/format";
import type { CreditTransactionType } from "@/lib/types";
import { useCredits } from "@/lib/useCredits";

const TRANSACTION_LABELS: Record<CreditTransactionType, string> = {
  VOTE: "Vote top.gg",
  PREMIUM_REDEEM: "Échange premium",
  ADMIN_ADJUST: "Ajustement administrateur",
  PREMIUM_REFUND: "Remboursement premium",
};

/**
 * Solde de crédits de l'utilisateur connecté, affiché sur la page « Mes serveurs » : combien il a,
 * comment en gagner (vote top.gg) et ce qu'il peut en faire (premium offert).
 */
export function CreditsCard() {
  const { credits, loading } = useCredits();

  if (loading) return <p className="text-muted">Chargement des crédits…</p>;
  // Solde indisponible (API injoignable) : la page reste utilisable sans cette carte.
  if (!credits) return null;

  return (
    <section className="card credits-card">
      <div className="credits-header">
        <div>
          <p className="stat-label">Mes crédits</p>
          <p className="credits-balance">{formatNumber(credits.balance)}</p>
          <p className="stat-hint">
            {credits.voteCount === 0
              ? "Aucun vote enregistré pour l'instant."
              : `${formatNumber(credits.voteCount)} vote(s) · ${formatNumber(credits.totalEarned)} crédit(s) gagnés au total`}
          </p>
        </div>
        {/* `/vote` est une redirection du dashboard vers la page top.gg du bot (next.config.js). */}
        <a className="button-primary" href="/vote" target="_blank" rel="noopener noreferrer">
          Voter
        </a>
      </div>

      <p className="text-muted" style={{ fontSize: 14 }}>
        Chaque vote sur top.gg rapporte {credits.creditsPerVote} crédits (un vote possible toutes
        les 12 h). Échange-les dans l&apos;onglet <strong>Premium</strong> d&apos;un serveur :{" "}
        {credits.offers.map((offer, index) => (
          <span key={offer.id}>
            {index > 0 && ", "}
            {formatNumber(offer.cost)} crédits pour {offer.durationLabel}
          </span>
        ))}
        .
      </p>

      {credits.transactions.length > 0 && (
        <details className="data-table-toggle">
          <summary>Historique des crédits</summary>
          <div style={{ overflowX: "auto", maxHeight: 260 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Opération</th>
                  <th>Montant</th>
                  <th>Solde</th>
                </tr>
              </thead>
              <tbody>
                {credits.transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDateTime(transaction.createdAt)}</td>
                    <td>{transaction.reason ?? TRANSACTION_LABELS[transaction.type]}</td>
                    <td
                      className={`numeric ${transaction.amount < 0 ? "amount-down" : "amount-up"}`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {formatNumber(transaction.amount)}
                    </td>
                    <td className="numeric">{formatNumber(transaction.balanceAfter)}</td>
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
