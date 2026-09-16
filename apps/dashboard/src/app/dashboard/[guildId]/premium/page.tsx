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

/** Statut premium détaillé : d'où il vient, et jusqu'à quand il court. */
function StatusCard({ status }: { status: PremiumStatus }) {
  if (!status.premium) {
    return (
      <div className="card">
        <span className="badge badge-muted">Inactif</span>
        <p className="text-muted" style={{ marginTop: 10 }}>
          Utilise <code>/premium upgrade</code> sur Discord pour souscrire l&apos;abonnement, ou
          échange tes crédits ci-dessous.
        </p>
      </div>
    );
  }

  const subscription = status.source === "SUBSCRIPTION";

  return (
    <div className="card">
      <div className="premium-status">
        <span className="badge badge-success">Actif</span>
        <span className="badge badge-accent">
          {subscription ? "Abonnement Discord" : "Crédits"}
        </span>
      </div>

      <div className="premium-detail text-muted">
        {subscription ? (
          <>
            <span>Payé directement sur Discord, sur ton moyen de paiement habituel.</span>
            <span>
              {status.subscription.renewsAt
                ? `Prochain renouvellement le ${formatDate(status.subscription.renewsAt)}.`
                : "Renouvellement automatique : Discord n'annonce pas encore de date."}
            </span>
          </>
        ) : (
          <>
            <span>Offert en échange de crédits gagnés en votant pour Gaulia sur top.gg.</span>
            <span>
              {status.credits.expiresAt
                ? `Expire le ${formatDate(status.credits.expiresAt)}, sans renouvellement automatique.`
                : "Aucune échéance enregistrée."}
            </span>
          </>
        )}
      </div>

      {/* Les deux sources peuvent coexister le temps qu'un octroi manuel arrive à échéance. */}
      {subscription && status.credits.active && status.credits.expiresAt && (
        <p className="notice notice-info">
          Du premium offert court aussi jusqu&apos;au {formatDate(status.credits.expiresAt)}.
          C&apos;est l&apos;abonnement qui prime : tu ne paies pas deux fois.
        </p>
      )}
    </div>
  );
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
              source: current.subscription.active ? current.source : "CREDITS",
              credits: {
                active: true,
                startedAt: current.credits.startedAt ?? new Date().toISOString(),
                expiresAt: result.premiumGrantedUntil,
              },
              balance: result.balance,
            }
          : current,
      );
      // Le badge de la barre de navigation lit le solde partagé : on le synchronise ici.
      setCreditBalance(result.balance);
      setConfirming(null);
      setSuccess(
        `Premium activé jusqu'au ${formatDate(result.premiumGrantedUntil)}. Il reste ${formatNumber(result.balance)} crédit(s) sur ton compte.`,
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

  // Échanger pendant un abonnement payant brûlerait les crédits en parallèle : l'API le refuse.
  const subscribed = status.subscription.active;

  return (
    <section className="settings-page">
      <h2>Statut premium</h2>
      <StatusCard status={status} />

      <h2 style={{ marginTop: 32 }}>Premium offert contre des crédits</h2>
      <div className="card">
        <p className="card-subtitle" style={{ marginTop: 0 }}>
          Tu disposes de <strong>{formatNumber(status.balance)} crédit(s)</strong>. Chaque vote pour
          Gaulia sur top.gg en rapporte 10, et un vote est possible toutes les 12 heures. Les durées
          échangées s&apos;ajoutent à un premium offert déjà en cours.
        </p>

        {subscribed && (
          <p className="notice notice-info">
            Ce serveur a déjà un abonnement payant : inutile d&apos;échanger des crédits, ils
            seraient consommés en parallèle sans rien ajouter.
          </p>
        )}

        <div className="offer-grid">
          {status.offers.map((offer) => {
            const affordable = status.balance >= offer.cost;
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
                  disabled={!affordable || pending || subscribed}
                  onClick={() => {
                    setConfirming(offer);
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  {affordable
                    ? "Échanger"
                    : `Il manque ${formatNumber(offer.cost - status.balance)} crédits`}
                </button>
              </div>
            );
          })}
        </div>

        {confirming && (
          <div className="confirm-box" role="alertdialog" aria-label="Confirmer l'échange">
            <p style={{ margin: 0 }}>
              Échanger <strong>{formatNumber(confirming.cost)} crédits</strong> contre{" "}
              <strong>{confirming.durationLabel}</strong> de premium sur ce serveur ? Si le serveur
              souscrit l&apos;abonnement payant avant la fin de cette période, la part non consommée
              te sera recréditée.
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
