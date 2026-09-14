"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { PremiumOffer, PremiumRedeemResult, PremiumStatus } from "@/lib/types";
import { setCreditBalance } from "@/lib/useCredits";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PremiumPage() {
  const params = useParams<{ guildId: string }>();
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [failed, setFailed] = useState(false);
  /** Offre en attente de confirmation, puis d'échange. */
  const [confirming, setConfirming] = useState<PremiumOffer | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PremiumStatus>(`/guilds/${params.guildId}/premium`)
      .then((data) => {
        setStatus(data);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [params.guildId]);

  async function redeem(offer: PremiumOffer): Promise<void> {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await api.post<PremiumRedeemResult>(
        `/guilds/${params.guildId}/premium/redeem`,
        { offer: offer.id },
      );
      setStatus((current) =>
        current
          ? {
              ...current,
              premium: true,
              premiumGrantedUntil: result.premiumGrantedUntil,
              credits: result.credits,
            }
          : current,
      );
      // Le badge de la barre de navigation lit le solde partagé : on le synchronise ici.
      setCreditBalance(result.credits);
      setConfirming(null);
      setSuccess(
        `Premium activé jusqu'au ${formatDate(result.premiumGrantedUntil)}. Il reste ${formatNumber(result.credits)} crédit(s) sur ton compte.`,
      );
    } catch (redeemError) {
      setError(
        redeemError instanceof ApiError && redeemError.status < 500
          ? redeemError.message
          : "Une erreur interne est survenue.",
      );
    } finally {
      setPending(false);
    }
  }

  if (failed) {
    return <div className="empty-state">Impossible de charger le statut premium.</div>;
  }

  if (!status) {
    return <p className="text-muted">Chargement…</p>;
  }

  return (
    <section className="settings-page">
      <h2>Statut premium</h2>
      <div className="card">
        {status.premium ? (
          <>
            <span className="badge badge-success">Actif</span>
            {status.premiumGrantedUntil && (
              <p className="text-muted" style={{ marginTop: 10 }}>
                Premium offert (crédits) jusqu&apos;au {formatDate(status.premiumGrantedUntil)}.
              </p>
            )}
            {status.premiumExpiresAt && (
              <p className="text-muted" style={{ marginTop: 10 }}>
                Abonnement : renouvellement le {formatDate(status.premiumExpiresAt)}.
              </p>
            )}
          </>
        ) : (
          <>
            <span className="badge badge-muted">Inactif</span>
            <p className="text-muted" style={{ marginTop: 10 }}>
              Utilise <code>/premium upgrade</code> sur Discord pour activer Gaulia Premium sur ce
              serveur, ou échange tes crédits ci-dessous.
            </p>
          </>
        )}
      </div>

      <h2 style={{ marginTop: 32 }}>Premium offert contre des crédits</h2>
      <div className="card">
        <p className="card-subtitle" style={{ marginTop: 0 }}>
          Tu disposes de <strong>{formatNumber(status.credits)} crédit(s)</strong>. Chaque vote pour
          Gaulia sur top.gg en rapporte 10, et un vote est possible toutes les 12 heures. Les durées
          échangées s&apos;ajoutent à un premium offert déjà en cours.
        </p>

        <div className="offer-grid">
          {status.offers.map((offer) => {
            const affordable = status.credits >= offer.cost;
            return (
              <div key={offer.id} className="offer-card">
                <div>
                  <h3 className="offer-title">{offer.label}</h3>
                  <p className="offer-meta">
                    {offer.durationLabel} · {formatNumber(offer.cost)} crédits
                  </p>
                </div>
                <button
                  type="button"
                  className="button-primary"
                  disabled={!affordable || pending}
                  onClick={() => {
                    setConfirming(offer);
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  {affordable
                    ? "Échanger"
                    : `Il manque ${formatNumber(offer.cost - status.credits)} crédits`}
                </button>
              </div>
            );
          })}
        </div>

        {confirming && (
          <div className="confirm-box" role="alertdialog" aria-label="Confirmer l'échange">
            <p style={{ margin: 0 }}>
              Échanger <strong>{formatNumber(confirming.cost)} crédits</strong> contre{" "}
              <strong>{confirming.durationLabel}</strong> de premium sur ce serveur ? Les crédits
              dépensés ne sont pas récupérables.
            </p>
            <div className="toolbar" style={{ margin: "12px 0 0" }}>
              <button
                type="button"
                className="button-primary"
                disabled={pending}
                onClick={() => void redeem(confirming)}
              >
                {pending ? "Échange…" : "Confirmer l'échange"}
              </button>
              <button
                type="button"
                className="button-secondary"
                disabled={pending}
                onClick={() => setConfirming(null)}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="notice notice-success" role="status">
            {success}
          </p>
        )}
      </div>
    </section>
  );
}
