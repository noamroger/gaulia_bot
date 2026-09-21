"use client";

import Link from "next/link";
import { Fragment, useEffect, useState, type ReactNode } from "react";

import { useLocale, useTranslation, type AppLocale, type Translator } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { userAvatarUrl } from "@/lib/discordCdn";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { GuildDataSummary, MyDataResponse, StoredGuildRef, UserDataExport } from "@/lib/types";

/** Signing in goes through the API, which brings the visitor back here rather than to the dashboard. */
const LOGIN_URL = `${API_URL}/auth/login?redirect=/my-data`;

/**
 * Confirmation the API expects in a deletion payload. The word the reader has to type comes from
 * the catalogue instead, so it stays readable in their language.
 */
const API_CONFIRMATION = "SUPPRIMER";

type Step = "idle" | "confirming" | "deleting" | "done";

/** Fills the {placeholders} of a translated sentence with nodes, so a link can sit inside it. */
function rich(text: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return text.split(/(\{\w+\})/).map((part, index) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={index}>{name ? (nodes[name] ?? part) : part}</Fragment>;
  });
}

/** Label of a value coming from the API, falling back to the raw value for an unknown one. */
function enumLabel(t: Translator, group: string, value: string): string {
  const key = `account.myData.${group}.${value}`;
  const label = t(key);
  return label === key ? value : label;
}

function guildLabel(t: Translator, name: string | null, id: string | null): string {
  if (name) return name;
  return id ? t("account.myData.deleteGuild.fallback", { id }) : "-";
}

function duration(t: Translator, seconds: number | null, locale: AppLocale): string {
  if (seconds === null) return "-";
  if (seconds < 3600) {
    return t("account.myData.duration.minutes", {
      value: formatNumber(Math.round(seconds / 60), locale),
    });
  }
  if (seconds < 86_400) {
    return t("account.myData.duration.hours", {
      value: formatNumber(Math.round(seconds / 3600), locale),
    });
  }
  return t("account.myData.duration.days", {
    value: formatNumber(Math.round(seconds / 86_400), locale),
  });
}

function errorMessage(error: unknown, t: Translator): string {
  return error instanceof ApiError && error.status < 500 && !error.generic
    ? error.message
    : t("common.state.error");
}

/** Triggers the JSON download without going through the server: everything is already loaded. */
function download(data: UserDataExport, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function LoginPrompt() {
  const t = useTranslation();

  return (
    <div className="card my-data-card">
      <h2 style={{ marginTop: 0 }}>{t("account.myData.signIn.title")}</h2>
      <p className="text-muted">{t("account.myData.signIn.body")}</p>
      <a className="button-primary" href={LOGIN_URL}>
        {t("account.myData.signIn.action")}
      </a>
    </div>
  );
}

/** Confirmation field shared by both deletions: type the word, then confirm or cancel. */
function ConfirmBox({
  inputId,
  value,
  pending,
  onChange,
  onConfirm,
  onCancel,
}: {
  inputId: string;
  value: string;
  pending: boolean;
  onChange: (next: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslation();
  const word = t("account.myData.confirm.word");

  return (
    <>
      <div className="field" style={{ maxWidth: 320 }}>
        <label htmlFor={inputId}>{t("account.myData.confirm.label", { word })}</label>
        <input
          id={inputId}
          className="input"
          type="text"
          autoComplete="off"
          value={value}
          disabled={pending}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div className="toolbar" style={{ marginBottom: 0 }}>
        <button
          type="button"
          className="button-danger"
          disabled={value.trim() !== word || pending}
          onClick={onConfirm}
        >
          {pending ? t("account.myData.confirm.pending") : t("account.myData.confirm.action")}
        </button>
        <button type="button" className="button-secondary" disabled={pending} onClick={onCancel}>
          {t("common.action.cancel")}
        </button>
      </div>
    </>
  );
}

/** Section collapsed by default: the detail only opens when the visitor asks for it. */
function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: ReactNode;
}) {
  const t = useTranslation();
  const locale = useLocale();

  return (
    <details className="my-data-section">
      <summary>
        <span>{title}</span>
        <strong>
          {count === 0 ? t("account.myData.stored.none") : formatNumber(count, locale)}
        </strong>
      </summary>
      <div className="my-data-section-body">
        {count === 0 ? <p className="text-muted">{empty}</p> : children}
      </div>
    </details>
  );
}

/**
 * A server administered by the signed-in account. What is stored is only fetched when the section
 * opens: an account can manage dozens of servers, and loading everything upfront would make as
 * many useless requests.
 */
function GuildSection({ guild }: { guild: StoredGuildRef }) {
  const [summary, setSummary] = useState<GuildDataSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const t = useTranslation();
  const locale = useLocale();

  async function load(): Promise<void> {
    if (summary || loading) return;
    setLoading(true);
    setError(null);
    try {
      setSummary(await api.get<GuildDataSummary>(`/me/guilds/${guild.guildId}/data`));
    } catch (loadError) {
      setError(errorMessage(loadError, t));
    } finally {
      setLoading(false);
    }
  }

  async function erase(): Promise<void> {
    setStep("deleting");
    setError(null);
    try {
      await api.delete(`/me/guilds/${guild.guildId}/data`, { confirm: API_CONFIRMATION });
      setStep("done");
      setSummary(null);
    } catch (eraseError) {
      setError(errorMessage(eraseError, t));
      setStep("confirming");
    }
  }

  function flag(field: "config" | "automod" | "music" | "adventure", stored: boolean): ReactNode {
    return (
      <li>
        <span>{t(`account.myData.deleteGuild.${field}.label`)}</span>
        <strong>{t(`account.myData.deleteGuild.${field}.${stored ? "stored" : "none"}`)}</strong>
      </li>
    );
  }

  return (
    <details
      className="my-data-section"
      onToggle={(event) => {
        if (event.currentTarget.open) void load();
      }}
    >
      <summary>
        <span>{guildLabel(t, guild.name, guild.guildId)}</span>
        <strong>
          {guild.botPresent
            ? t("account.myData.deleteGuild.present")
            : t("account.myData.deleteGuild.left")}
        </strong>
      </summary>
      <div className="my-data-section-body">
        {loading && <p className="text-muted">{t("common.state.loading")}</p>}

        {step === "done" ? (
          <p className="notice notice-success" role="status" style={{ marginTop: 0 }}>
            {t("account.myData.deleteGuild.deleted")}
            {guild.botPresent ? ` ${t("account.myData.deleteGuild.deletedBotPresent")}` : ""}
          </p>
        ) : (
          summary && (
            <>
              <ul className="data-summary">
                {flag("config", summary.configured)}
                <li>
                  <span>{t("account.myData.deleteGuild.cases")}</span>
                  <strong>{formatNumber(summary.moderationCases, locale)}</strong>
                </li>
                <li>
                  <span>{t("account.myData.deleteGuild.warns")}</span>
                  <strong>{formatNumber(summary.warns, locale)}</strong>
                </li>
                {flag("automod", summary.automodConfig)}
                {flag("music", summary.musicSettings)}
                <li>
                  <span>{t("account.myData.deleteGuild.playlists")}</span>
                  <strong>{formatNumber(summary.blindtestPlaylists, locale)}</strong>
                </li>
                {flag("adventure", summary.adventureSettings)}
                <li>
                  <span>{t("account.myData.deleteGuild.premium")}</span>
                  <strong>{formatNumber(summary.premiumEntitlements, locale)}</strong>
                </li>
              </ul>

              <p className="text-muted" style={{ fontSize: 13 }}>
                {t("account.myData.deleteGuild.note")}
                {guild.botPresent ? ` ${t("account.myData.deleteGuild.noteBotPresent")}` : ""}
              </p>

              {step === "idle" ? (
                <button
                  type="button"
                  className="button-danger"
                  onClick={() => setStep("confirming")}
                >
                  {t("account.myData.deleteGuild.action")}
                </button>
              ) : (
                <ConfirmBox
                  inputId={`confirm-guild-${guild.guildId}`}
                  value={confirmation}
                  pending={step === "deleting"}
                  onChange={setConfirmation}
                  onConfirm={() => void erase()}
                  onCancel={() => {
                    setStep("idle");
                    setConfirmation("");
                    setError(null);
                  }}
                />
              )}
            </>
          )
        )}

        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </details>
  );
}

export default function MyDataPage() {
  const [payload, setPayload] = useState<MyDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [step, setStep] = useState<Step>("idle");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const t = useTranslation();
  const locale = useLocale();

  useEffect(() => {
    let cancelled = false;

    api
      .get<MyDataResponse>("/me/data")
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        // No session: the page offers to sign in, which is not an error.
        if (loadError instanceof ApiError && loadError.status === 401) setAuthenticated(false);
        else setError(errorMessage(loadError, t));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  async function erase(): Promise<void> {
    setStep("deleting");
    setError(null);
    try {
      await api.delete("/me/data", { confirm: API_CONFIRMATION });
      setStep("done");
      setPayload(null);
    } catch (eraseError) {
      setError(errorMessage(eraseError, t));
      setStep("confirming");
    }
  }

  if (step === "done") {
    return (
      <div className="container">
        <h1>{t("account.myData.title")}</h1>
        <div className="card my-data-card">
          <p className="notice notice-success" role="status" style={{ marginTop: 0 }}>
            {t("account.myData.done.notice")}
          </p>
          <p className="text-muted">{t("account.myData.done.body")}</p>
          <Link className="button-primary" href="/">
            {t("account.myData.done.home")}
          </Link>
        </div>
      </div>
    );
  }

  const data = payload?.data;
  const account = payload?.account;
  const guilds = payload?.guilds ?? [];
  const contactLink = <Link href="/contact">{t("account.contact.title")}</Link>;

  return (
    <div className="container">
      <p>
        <Link href="/" className="text-muted">
          ← {t("account.myData.back")}
        </Link>
      </p>

      <h1>{t("account.myData.title")}</h1>
      <p className="text-muted my-data-intro">
        {rich(t("account.myData.intro"), {
          privacy: <Link href="/privacy">{t("account.myData.privacyLink")}</Link>,
        })}
      </p>

      {loading && <p className="text-muted">{t("common.state.loading")}</p>}
      {!loading && !authenticated && <LoginPrompt />}
      {!loading && authenticated && error && !data && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}

      {!loading && data && account && (
        <>
          <section className="card my-data-card">
            <div className="contact-identity">
              <img
                src={userAvatarUrl(account.userId, account.avatar, 64)}
                alt=""
                width={44}
                height={44}
                className="contact-avatar"
              />
              <div>
                <strong>{account.username}</strong>
                <p className="text-muted">
                  {account.userId}
                  {account.email ? ` · ${account.email}` : ""}
                </p>
              </div>
            </div>
            <p className="field-hint" style={{ marginTop: 10 }}>
              {t("account.myData.account.hint")}
            </p>

            <div className="toolbar" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className="button-primary"
                onClick={() =>
                  download(data, t("account.myData.account.fileName", { userId: data.userId }))
                }
              >
                {t("account.myData.account.download")}
              </button>
              <span className="text-muted" style={{ fontSize: 13 }}>
                {t("account.myData.account.generatedAt", {
                  date: formatDateTime(data.generatedAt, locale),
                })}
              </span>
            </div>
          </section>

          <section className="card my-data-card">
            <h2 className="card-title">{t("account.myData.stored.title")}</h2>
            <p className="card-subtitle">{t("account.myData.stored.subtitle")}</p>

            <Section
              title={t("account.myData.sanctions.title")}
              count={data.sanctionsReceived.length}
              empty={t("account.myData.sanctions.empty")}
            >
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("account.myData.columns.guild")}</th>
                      <th>{t("account.myData.columns.type")}</th>
                      <th>{t("account.myData.columns.reason")}</th>
                      <th>{t("account.myData.columns.duration")}</th>
                      <th>{t("account.myData.columns.date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sanctionsReceived.map((entry) => (
                      <tr key={`${entry.guildId}-${entry.caseNumber}`}>
                        <td>{guildLabel(t, entry.guildName, entry.guildId)}</td>
                        <td>{enumLabel(t, "caseTypes", entry.type)}</td>
                        <td>{entry.reason ?? "-"}</td>
                        <td>{duration(t, entry.durationSecs, locale)}</td>
                        <td>{formatDateTime(entry.createdAt, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-muted" style={{ fontSize: 13 }}>
                {rich(t("account.myData.sanctions.note"), { contact: contactLink })}
              </p>
            </Section>

            <Section
              title={t("account.myData.warns.title")}
              count={data.warnsReceived.length}
              empty={t("account.myData.warns.empty")}
            >
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("account.myData.columns.guild")}</th>
                      <th>{t("account.myData.columns.reason")}</th>
                      <th>{t("account.myData.columns.status")}</th>
                      <th>{t("account.myData.columns.date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.warnsReceived.map((entry) => (
                      <tr key={`${entry.guildId}-${entry.createdAt}`}>
                        <td>{guildLabel(t, entry.guildName, entry.guildId)}</td>
                        <td>{entry.reason ?? "-"}</td>
                        <td>
                          {entry.active
                            ? t("account.myData.warns.active")
                            : t("account.myData.warns.removed")}
                        </td>
                        <td>{formatDateTime(entry.createdAt, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-muted" style={{ fontSize: 13 }}>
                {t("account.myData.warns.note")}
              </p>
            </Section>

            <Section
              title={t("account.myData.moderator.title")}
              count={data.moderatorActivity.moderationCases + data.moderatorActivity.warns}
              empty={t("account.myData.moderator.empty")}
            >
              <ul className="data-summary">
                <li>
                  <span>{t("account.myData.moderator.cases")}</span>
                  <strong>{formatNumber(data.moderatorActivity.moderationCases, locale)}</strong>
                </li>
                <li>
                  <span>{t("account.myData.moderator.warns")}</span>
                  <strong>{formatNumber(data.moderatorActivity.warns, locale)}</strong>
                </li>
              </ul>
              <p className="text-muted" style={{ fontSize: 13 }}>
                {t("account.myData.moderator.note")}
              </p>
            </Section>

            <Section
              title={t("account.myData.credits.title")}
              count={(data.credits ? 1 : 0) + data.topggVotes.length}
              empty={t("account.myData.credits.empty")}
            >
              {data.credits && (
                <ul className="data-summary">
                  <li>
                    <span>{t("account.myData.credits.balance")}</span>
                    <strong>{formatNumber(data.credits.balance, locale)}</strong>
                  </li>
                  <li>
                    <span>{t("account.myData.credits.totalEarned")}</span>
                    <strong>{formatNumber(data.credits.totalEarned, locale)}</strong>
                  </li>
                  <li>
                    <span>{t("account.myData.credits.voteCount")}</span>
                    <strong>{formatNumber(data.credits.voteCount, locale)}</strong>
                  </li>
                  <li>
                    <span>{t("account.myData.credits.lastVote")}</span>
                    <strong>
                      {data.credits.lastVoteAt
                        ? formatDateTime(data.credits.lastVoteAt, locale)
                        : "-"}
                    </strong>
                  </li>
                </ul>
              )}
              {data.credits && data.credits.transactions.length > 0 && (
                <div className="table-scroll" style={{ marginTop: 16 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t("account.myData.columns.movement")}</th>
                        <th className="numeric">{t("account.myData.columns.amount")}</th>
                        <th className="numeric">{t("account.myData.columns.balanceAfter")}</th>
                        <th>{t("account.myData.columns.guild")}</th>
                        <th>{t("account.myData.columns.date")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.credits.transactions.map((entry) => (
                        <tr key={`${entry.createdAt}-${entry.balanceAfter}`}>
                          <td>{enumLabel(t, "creditTypes", entry.type)}</td>
                          <td className="numeric">
                            {entry.amount > 0
                              ? `+${formatNumber(entry.amount, locale)}`
                              : formatNumber(entry.amount, locale)}
                          </td>
                          <td className="numeric">{formatNumber(entry.balanceAfter, locale)}</td>
                          <td>
                            {entry.guildId ? guildLabel(t, entry.guildName, entry.guildId) : "-"}
                          </td>
                          <td>{formatDateTime(entry.createdAt, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {data.topggVotes.length > 0 && (
                <p className="text-muted" style={{ fontSize: 13 }}>
                  {t("account.myData.credits.votesNote", {
                    count: data.topggVotes.length,
                    value: formatNumber(data.topggVotes.length, locale),
                  })}
                </p>
              )}
            </Section>

            <Section
              title={t("account.myData.premium.title")}
              count={data.premiumEntitlements.length}
              empty={t("account.myData.premium.empty")}
            >
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("account.myData.columns.guild")}</th>
                      <th>{t("account.myData.columns.start")}</th>
                      <th>{t("account.myData.columns.end")}</th>
                      <th>{t("account.myData.columns.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.premiumEntitlements.map((entry) => (
                      <tr key={entry.entitlementId}>
                        <td>
                          {entry.guildId ? guildLabel(t, entry.guildName, entry.guildId) : "-"}
                        </td>
                        <td>{entry.startsAt ? formatDateTime(entry.startsAt, locale) : "-"}</td>
                        <td>{entry.endsAt ? formatDateTime(entry.endsAt, locale) : "-"}</td>
                        <td>
                          {entry.deleted
                            ? t("account.myData.premium.ended")
                            : t("account.myData.premium.active")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-muted" style={{ fontSize: 13 }}>
                {t("account.myData.premium.note")}
              </p>
            </Section>

            <Section
              title={t("account.myData.adventure.title")}
              count={data.adventure ? 1 : 0}
              empty={t("account.myData.adventure.empty")}
            >
              {data.adventure && (
                <>
                  <ul className="data-summary">
                    <li>
                      <span>{t("account.myData.adventure.characterClass")}</span>
                      <strong>{enumLabel(t, "classes", data.adventure.characterClass)}</strong>
                    </li>
                    <li>
                      <span>{t("account.myData.adventure.level")}</span>
                      <strong>{formatNumber(data.adventure.level, locale)}</strong>
                    </li>
                    <li>
                      <span>{t("account.myData.adventure.totalXp")}</span>
                      <strong>{formatNumber(data.adventure.totalXp, locale)}</strong>
                    </li>
                    <li>
                      <span>{t("account.myData.adventure.goldAndEchoes")}</span>
                      <strong>
                        {formatNumber(data.adventure.gold, locale)} ·{" "}
                        {formatNumber(data.adventure.echoes, locale)}
                      </strong>
                    </li>
                    <li>
                      <span>{t("account.myData.adventure.items")}</span>
                      <strong>{formatNumber(data.adventure.items.length, locale)}</strong>
                    </li>
                    <li>
                      <span>{t("account.myData.adventure.achievements")}</span>
                      <strong>{formatNumber(data.adventure.achievements.length, locale)}</strong>
                    </li>
                    <li>
                      <span>{t("account.myData.adventure.record")}</span>
                      <strong>
                        {formatNumber(data.adventure.explorations, locale)} ·{" "}
                        {formatNumber(data.adventure.victories, locale)} ·{" "}
                        {formatNumber(data.adventure.defeats, locale)}
                      </strong>
                    </li>
                    <li>
                      <span>{t("account.myData.adventure.lastPlayed")}</span>
                      <strong>
                        {data.adventure.lastPlayedAt
                          ? formatDateTime(data.adventure.lastPlayedAt, locale)
                          : "-"}
                      </strong>
                    </li>
                  </ul>
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    {t("account.myData.adventure.note")}
                  </p>
                </>
              )}
            </Section>

            <Section
              title={t("account.myData.guilds.title")}
              count={account.manageableGuilds.length}
              empty={t("account.myData.guilds.empty")}
            >
              <ul className="data-summary">
                {account.manageableGuilds.map((guild) => (
                  <li key={guild.id}>
                    <span>{guild.name}</span>
                    <strong>{guild.id}</strong>
                  </li>
                ))}
              </ul>
              <p className="text-muted" style={{ fontSize: 13 }}>
                {t("account.myData.guilds.note")}
              </p>
            </Section>
          </section>

          <section className="card my-data-card my-data-danger">
            <h2 className="card-title">{t("account.myData.deleteAccount.title")}</h2>
            <p className="card-subtitle">{t("account.myData.deleteAccount.subtitle")}</p>
            <ul className="my-data-list">
              {t.list("account.myData.deleteAccount.items").map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-muted" style={{ fontSize: 13 }}>
              {rich(t("account.myData.deleteAccount.note"), { contact: contactLink })}
            </p>

            {step === "idle" ? (
              <button type="button" className="button-danger" onClick={() => setStep("confirming")}>
                {t("account.myData.deleteAccount.action")}
              </button>
            ) : (
              <ConfirmBox
                inputId="confirm-account"
                value={confirmation}
                pending={step === "deleting"}
                onChange={setConfirmation}
                onConfirm={() => void erase()}
                onCancel={() => {
                  setStep("idle");
                  setConfirmation("");
                  setError(null);
                }}
              />
            )}

            {error && (
              <p className="notice notice-error" role="alert">
                {error}
              </p>
            )}
          </section>

          <section className="card my-data-card my-data-danger">
            <h2 className="card-title">{t("account.myData.deleteGuild.title")}</h2>
            <p className="card-subtitle">{t("account.myData.deleteGuild.subtitle")}</p>

            {guilds.length === 0 ? (
              <p className="text-muted">{t("account.myData.deleteGuild.empty")}</p>
            ) : (
              guilds.map((guild) => <GuildSection key={guild.guildId} guild={guild} />)
            )}
          </section>
        </>
      )}
    </div>
  );
}
