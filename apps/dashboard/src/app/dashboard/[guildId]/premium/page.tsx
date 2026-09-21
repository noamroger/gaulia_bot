"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useLocale, useTranslation, type AppLocale, type Translator } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { offerDuration, offerLabel } from "@/lib/premiumOffers";
import type { PremiumOffer, PremiumRedeemResult, PremiumStatus } from "@/lib/types";
import { setCreditBalance } from "@/lib/useCredits";

function formatLongDate(iso: string, locale: AppLocale): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function errorMessage(error: unknown, t: Translator): string {
  return error instanceof ApiError && error.status < 500 && !error.generic
    ? error.message
    : t("common.state.error");
}

/** Detailed premium status: where it comes from, and how long it runs. */
function StatusCard({ status }: { status: PremiumStatus }) {
  const t = useTranslation();
  const locale = useLocale();

  if (!status.premium) {
    return (
      <div className="card">
        <span className="badge badge-muted">{t("premium.status.inactive")}</span>
        <p className="text-muted" style={{ marginTop: 10 }}>
          {t("premium.status.offerBefore")} <code>{t("premium.status.offerCommand")}</code>{" "}
          {t("premium.status.offerAfter")}
        </p>
      </div>
    );
  }

  const subscription = status.source === "SUBSCRIPTION";

  return (
    <div className="card">
      <div className="premium-status">
        <span className="badge badge-success">{t("premium.status.active")}</span>
        <span className="badge badge-accent">
          {subscription ? t("premium.status.fromSubscription") : t("premium.status.fromCredits")}
        </span>
      </div>

      <div className="premium-detail text-muted">
        {subscription ? (
          <>
            <span>{t("premium.status.subscriptionSource")}</span>
            <span>
              {status.subscription.renewsAt
                ? t("premium.status.renewsAt", {
                    date: formatLongDate(status.subscription.renewsAt, locale),
                  })
                : t("premium.status.renewsUnknown")}
            </span>
          </>
        ) : (
          <>
            <span>{t("premium.status.creditsSource")}</span>
            <span>
              {status.credits.expiresAt
                ? t("premium.status.expiresAt", {
                    date: formatLongDate(status.credits.expiresAt, locale),
                  })
                : t("premium.status.noExpiry")}
            </span>
          </>
        )}
      </div>

      {/* Both sources can overlap while a manual grant runs out. */}
      {subscription && status.credits.active && status.credits.expiresAt && (
        <p className="notice notice-info">
          {t("premium.status.bothSources", {
            date: formatLongDate(status.credits.expiresAt, locale),
          })}
        </p>
      )}
    </div>
  );
}

export default function PremiumPage() {
  const t = useTranslation();
  const locale = useLocale();
  const params = useParams<{ guildId: string }>();
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [failed, setFailed] = useState(false);
  /** Offer waiting for a confirmation, then for the exchange. */
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
      // The navigation badge reads the shared balance, so it is synced here.
      setCreditBalance(result.balance);
      setConfirming(null);
      setSuccess(
        t("premium.success", {
          count: result.balance,
          value: formatNumber(result.balance, locale),
          date: formatLongDate(result.premiumGrantedUntil, locale),
        }),
      );
    } catch (redeemError) {
      setError(errorMessage(redeemError, t));
    } finally {
      setPending(false);
    }
  }

  if (failed) {
    return <div className="empty-state">{t("premium.loadError")}</div>;
  }

  if (!status) {
    return <p className="text-muted">{t("common.state.loading")}</p>;
  }

  // Redeeming during a paid subscription would burn credits in parallel: the API turns it down.
  const subscribed = status.subscription.active;

  return (
    <section className="settings-page">
      <h2>{t("premium.status.title")}</h2>
      <StatusCard status={status} />

      <h2 style={{ marginTop: 32 }}>{t("premium.redeem.title")}</h2>
      <div className="card">
        <p className="card-subtitle" style={{ marginTop: 0 }}>
          {t("premium.redeem.balanceBefore")}{" "}
          <strong>
            {t("premium.redeem.balanceValue", {
              count: status.balance,
              value: formatNumber(status.balance, locale),
            })}
          </strong>
          . {t("premium.redeem.balanceAfter")}
        </p>

        {subscribed && <p className="notice notice-info">{t("premium.redeem.subscribed")}</p>}

        <div className="offer-grid">
          {status.offers.map((offer) => {
            const affordable = status.balance >= offer.cost;
            const shortfall = offer.cost - status.balance;
            return (
              <div key={offer.id} className="offer-card">
                <div>
                  <h3 className="offer-title">{offerLabel(offer, t)}</h3>
                  <p className="offer-meta">
                    {offerDuration(offer, t)} ·{" "}
                    {t("premium.redeem.cost", {
                      count: offer.cost,
                      value: formatNumber(offer.cost, locale),
                    })}
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
                    ? t("premium.redeem.action")
                    : t("premium.redeem.missing", {
                        value: formatNumber(shortfall, locale),
                      })}
                </button>
              </div>
            );
          })}
        </div>

        {confirming && (
          <div className="confirm-box" role="alertdialog" aria-label={t("premium.confirm.aria")}>
            <p style={{ margin: 0 }}>
              {t("premium.confirm.before")}{" "}
              <strong>
                {t("premium.confirm.credits", {
                  count: confirming.cost,
                  value: formatNumber(confirming.cost, locale),
                })}
              </strong>{" "}
              {t("premium.confirm.middle")} <strong>{offerDuration(confirming, t)}</strong>{" "}
              {t("premium.confirm.after")}
            </p>
            <div className="toolbar" style={{ margin: "12px 0 0" }}>
              <button
                type="button"
                className="button-primary"
                disabled={pending}
                onClick={() => void redeem(confirming)}
              >
                {pending ? t("premium.confirm.pending") : t("premium.confirm.submit")}
              </button>
              <button
                type="button"
                className="button-secondary"
                disabled={pending}
                onClick={() => setConfirming(null)}
              >
                {t("common.action.cancel")}
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
