"use client";

import { useState, type FormEvent } from "react";

import { api, ApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { GuildDataSummary, UserDataSummary } from "@/lib/types";

type Target = "guild" | "user";
type Step = "idle" | "loading" | "found" | "confirming" | "deleting" | "done";

const SNOWFLAKE = /^\d{17,20}$/;

function endpoint(target: Target, id: string): string {
  return `/admin/data/${target === "guild" ? "guilds" : "users"}/${id}`;
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError && error.status < 500
    ? error.message
    : "Une erreur interne est survenue.";
}

function GuildSummary({ summary }: { summary: GuildDataSummary }) {
  return (
    <ul className="data-summary">
      <li>
        <span>Configuration du serveur</span>
        <strong>{summary.configured ? (summary.name ?? "Oui") : "Aucune"}</strong>
      </li>
      <li>
        <span>Cas de modération</span>
        <strong>{formatNumber(summary.moderationCases)}</strong>
      </li>
      <li>
        <span>Avertissements</span>
        <strong>{formatNumber(summary.warns)}</strong>
      </li>
      <li>
        <span>Configuration automod</span>
        <strong>{summary.automodConfig ? "Oui" : "Non"}</strong>
      </li>
      <li>
        <span>Réglages musique</span>
        <strong>{summary.musicSettings ? "Oui" : "Non"}</strong>
      </li>
      <li>
        <span>Listes de blindtest</span>
        <strong>{formatNumber(summary.blindtestPlaylists)}</strong>
      </li>
      <li>
        <span>Droits premium en cache</span>
        <strong>{formatNumber(summary.premiumEntitlements)}</strong>
      </li>
    </ul>
  );
}

function UserSummary({ summary }: { summary: UserDataSummary }) {
  return (
    <ul className="data-summary">
      <li>
        <span>Sanctions reçues (supprimées)</span>
        <strong>{formatNumber(summary.moderationCasesAsTarget)}</strong>
      </li>
      <li>
        <span>Avertissements reçus (supprimés)</span>
        <strong>{formatNumber(summary.warnsAsTarget)}</strong>
      </li>
      <li>
        <span>Sanctions données en tant que modérateur (anonymisées)</span>
        <strong>{formatNumber(summary.moderationCasesAsModerator)}</strong>
      </li>
      <li>
        <span>Avertissements donnés en tant que modérateur (anonymisés)</span>
        <strong>{formatNumber(summary.warnsAsModerator)}</strong>
      </li>
      <li>
        <span>Droits premium en cache (supprimés)</span>
        <strong>{formatNumber(summary.premiumEntitlements)}</strong>
      </li>
    </ul>
  );
}

export default function AdminDataPage() {
  const [target, setTarget] = useState<Target>("guild");
  const [id, setId] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [summary, setSummary] = useState<GuildDataSummary | UserDataSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmedId = id.trim();
  const idIsValid = SNOWFLAKE.test(trimmedId);

  function clearResult(): void {
    setStep("idle");
    setSummary(null);
    setError(null);
  }

  function selectTarget(nextTarget: Target): void {
    setTarget(nextTarget);
    clearResult();
  }

  async function lookup(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!idIsValid) return;
    setStep("loading");
    setError(null);
    setSummary(null);
    try {
      setSummary(await api.get<GuildDataSummary | UserDataSummary>(endpoint(target, trimmedId)));
      setStep("found");
    } catch (lookupError) {
      setError(errorMessage(lookupError));
      setStep("idle");
    }
  }

  async function erase(): Promise<void> {
    setStep("deleting");
    setError(null);
    try {
      await api.delete(endpoint(target, trimmedId));
      setStep("done");
    } catch (eraseError) {
      setError(errorMessage(eraseError));
      setStep("found");
    }
  }

  const locked = step === "loading" || step === "deleting";

  return (
    <section className="card data-erasure">
      <h2 className="card-title">Suppression de données</h2>
      <p className="card-subtitle">
        Pour traiter une demande de suppression : saisis l&apos;identifiant Discord du serveur ou de
        l&apos;utilisateur, vérifie ce qui sera supprimé, puis confirme. L&apos;opération est
        définitive.
      </p>

      <div className="segmented" role="group" aria-label="Type d'identifiant">
        <button
          type="button"
          aria-pressed={target === "guild"}
          disabled={locked}
          onClick={() => selectTarget("guild")}
        >
          Serveur
        </button>
        <button
          type="button"
          aria-pressed={target === "user"}
          disabled={locked}
          onClick={() => selectTarget("user")}
        >
          Utilisateur
        </button>
      </div>

      <form className="toolbar" style={{ marginTop: 16 }} onSubmit={(event) => void lookup(event)}>
        <input
          type="text"
          inputMode="numeric"
          className="search-input"
          placeholder={target === "guild" ? "ID du serveur" : "ID de l'utilisateur"}
          aria-label={target === "guild" ? "ID du serveur" : "ID de l'utilisateur"}
          value={id}
          disabled={locked}
          onChange={(event) => {
            setId(event.target.value);
            clearResult();
          }}
        />
        <button type="submit" className="button-primary" disabled={!idIsValid || locked}>
          {step === "loading" ? "Recherche…" : "Rechercher"}
        </button>
      </form>
      {trimmedId !== "" && !idIsValid && (
        <p className="field-hint">Un identifiant Discord contient 17 à 20 chiffres.</p>
      )}

      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}

      {summary && step !== "done" && (
        <div className="data-result">
          {"guildId" in summary ? (
            <GuildSummary summary={summary} />
          ) : (
            <UserSummary summary={summary} />
          )}

          <p className="text-muted" style={{ fontSize: 13 }}>
            {target === "guild"
              ? "Toutes les données de ce serveur seront supprimées. Si Gaulia est encore dessus, une configuration vierge sera recréée automatiquement."
              : "Les sanctions et avertissements reçus seront supprimés ; ceux donnés en tant que modérateur resteront dans l'historique des serveurs, sans son identité."}{" "}
            Un abonnement premium encore actif chez Discord sera resynchronisé au prochain
            redémarrage du bot.
          </p>

          {step === "confirming" || step === "deleting" ? (
            <div className="toolbar">
              <button
                type="button"
                className="button-danger"
                disabled={step === "deleting"}
                onClick={() => void erase()}
              >
                {step === "deleting" ? "Suppression…" : "Confirmer la suppression définitive"}
              </button>
              <button
                type="button"
                className="button-secondary"
                disabled={step === "deleting"}
                onClick={() => setStep("found")}
              >
                Annuler
              </button>
            </div>
          ) : (
            <button type="button" className="button-danger" onClick={() => setStep("confirming")}>
              Supprimer ces données
            </button>
          )}
        </div>
      )}

      {step === "done" && (
        <p className="notice notice-success" role="status">
          Données supprimées pour l&apos;identifiant {trimmedId}.
        </p>
      )}
    </section>
  );
}
