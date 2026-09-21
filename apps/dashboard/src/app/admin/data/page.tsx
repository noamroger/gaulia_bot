"use client";

import { useState, type FormEvent } from "react";

import { useLocale, useTranslation, type Translator } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { GuildDataSummary, UserDataSummary } from "@/lib/types";

type Target = "guild" | "user";
type Step = "idle" | "loading" | "found" | "confirming" | "deleting" | "done";

const SNOWFLAKE = /^\d{17,20}$/;

function endpoint(target: Target, id: string): string {
  return `/admin/data/${target === "guild" ? "guilds" : "users"}/${id}`;
}

function errorMessage(error: unknown, t: Translator): string {
  return error instanceof ApiError && error.status < 500 && !error.generic
    ? error.message
    : t("common.state.error");
}

function GuildSummary({ summary }: { summary: GuildDataSummary }) {
  const t = useTranslation();
  const locale = useLocale();
  const flag = (value: boolean): string => (value ? t("admin.data.yes") : t("admin.data.no"));

  return (
    <ul className="data-summary">
      <li>
        <span>{t("admin.data.guildSummary.configured")}</span>
        <strong>
          {summary.configured
            ? (summary.name ?? t("admin.data.yes"))
            : t("admin.data.guildSummary.none")}
        </strong>
      </li>
      <li>
        <span>{t("admin.data.guildSummary.moderationCases")}</span>
        <strong>{formatNumber(summary.moderationCases, locale)}</strong>
      </li>
      <li>
        <span>{t("admin.data.guildSummary.warns")}</span>
        <strong>{formatNumber(summary.warns, locale)}</strong>
      </li>
      <li>
        <span>{t("admin.data.guildSummary.automodConfig")}</span>
        <strong>{flag(summary.automodConfig)}</strong>
      </li>
      <li>
        <span>{t("admin.data.guildSummary.musicSettings")}</span>
        <strong>{flag(summary.musicSettings)}</strong>
      </li>
      <li>
        <span>{t("admin.data.guildSummary.blindtestPlaylists")}</span>
        <strong>{formatNumber(summary.blindtestPlaylists, locale)}</strong>
      </li>
      <li>
        <span>{t("admin.data.guildSummary.adventureSettings")}</span>
        <strong>{flag(summary.adventureSettings)}</strong>
      </li>
      <li>
        <span>{t("admin.data.guildSummary.premiumEntitlements")}</span>
        <strong>{formatNumber(summary.premiumEntitlements, locale)}</strong>
      </li>
    </ul>
  );
}

function UserSummary({ summary }: { summary: UserDataSummary }) {
  const t = useTranslation();
  const locale = useLocale();

  return (
    <ul className="data-summary">
      <li>
        <span>{t("admin.data.userSummary.casesAsTarget")}</span>
        <strong>{formatNumber(summary.moderationCasesAsTarget, locale)}</strong>
      </li>
      <li>
        <span>{t("admin.data.userSummary.warnsAsTarget")}</span>
        <strong>{formatNumber(summary.warnsAsTarget, locale)}</strong>
      </li>
      <li>
        <span>{t("admin.data.userSummary.casesAsModerator")}</span>
        <strong>{formatNumber(summary.moderationCasesAsModerator, locale)}</strong>
      </li>
      <li>
        <span>{t("admin.data.userSummary.warnsAsModerator")}</span>
        <strong>{formatNumber(summary.warnsAsModerator, locale)}</strong>
      </li>
      <li>
        <span>{t("admin.data.userSummary.premiumEntitlements")}</span>
        <strong>{formatNumber(summary.premiumEntitlements, locale)}</strong>
      </li>
      <li>
        <span>{t("admin.data.userSummary.creditBalance")}</span>
        <strong>{formatNumber(summary.creditBalance, locale)}</strong>
      </li>
      <li>
        <span>{t("admin.data.userSummary.topggVotes")}</span>
        <strong>{formatNumber(summary.topggVotes, locale)}</strong>
      </li>
      <li>
        <span>{t("admin.data.userSummary.adventureCharacter")}</span>
        <strong>
          {summary.adventureLevel === null
            ? t("admin.data.userSummary.adventureNone")
            : t("admin.data.userSummary.adventureLevel", { level: summary.adventureLevel })}
        </strong>
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

  const t = useTranslation();

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
      setError(errorMessage(lookupError, t));
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
      setError(errorMessage(eraseError, t));
      setStep("found");
    }
  }

  const locked = step === "loading" || step === "deleting";
  const idLabel = target === "guild" ? t("admin.data.guildId") : t("admin.data.userId");

  return (
    <section className="card data-erasure">
      <h2 className="card-title">{t("admin.data.title")}</h2>
      <p className="card-subtitle">{t("admin.data.description")}</p>

      <div className="segmented" role="group" aria-label={t("admin.data.targetLabel")}>
        <button
          type="button"
          aria-pressed={target === "guild"}
          disabled={locked}
          onClick={() => selectTarget("guild")}
        >
          {t("admin.data.guild")}
        </button>
        <button
          type="button"
          aria-pressed={target === "user"}
          disabled={locked}
          onClick={() => selectTarget("user")}
        >
          {t("admin.data.user")}
        </button>
      </div>

      <form className="toolbar" style={{ marginTop: 16 }} onSubmit={(event) => void lookup(event)}>
        <input
          type="text"
          inputMode="numeric"
          className="search-input"
          placeholder={idLabel}
          aria-label={idLabel}
          value={id}
          disabled={locked}
          onChange={(event) => {
            setId(event.target.value);
            clearResult();
          }}
        />
        <button type="submit" className="button-primary" disabled={!idIsValid || locked}>
          {step === "loading" ? t("admin.data.searching") : t("admin.data.search")}
        </button>
      </form>
      {trimmedId !== "" && !idIsValid && <p className="field-hint">{t("admin.data.invalidId")}</p>}

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
            {target === "guild" ? t("admin.data.guildWarning") : t("admin.data.userWarning")}{" "}
            {t("admin.data.premiumNote")}
          </p>

          {step === "confirming" || step === "deleting" ? (
            <div className="toolbar">
              <button
                type="button"
                className="button-danger"
                disabled={step === "deleting"}
                onClick={() => void erase()}
              >
                {step === "deleting" ? t("admin.data.deleting") : t("admin.data.confirmDelete")}
              </button>
              <button
                type="button"
                className="button-secondary"
                disabled={step === "deleting"}
                onClick={() => setStep("found")}
              >
                {t("common.action.cancel")}
              </button>
            </div>
          ) : (
            <button type="button" className="button-danger" onClick={() => setStep("confirming")}>
              {t("admin.data.delete")}
            </button>
          )}
        </div>
      )}

      {step === "done" && (
        <p className="notice notice-success" role="status">
          {t("admin.data.done", { id: trimmedId })}
        </p>
      )}
    </section>
  );
}
