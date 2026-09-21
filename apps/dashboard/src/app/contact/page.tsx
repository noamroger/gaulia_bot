"use client";

import Link from "next/link";
import { Fragment, useEffect, useState, type ReactNode } from "react";

import { useLocale, useTranslation, type Translator } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import { API_URL, SUPPORT_INVITE } from "@/lib/config";
import { userAvatarUrl } from "@/lib/discordCdn";
import { formatNumber } from "@/lib/format";
import type { ManageableGuild, Session } from "@/lib/types";

const SUBJECTS = ["question", "bug", "premium", "data", "other"];

const MESSAGE_MIN = 20;
const MESSAGE_MAX = 4000;
/** Signing in goes through the API, which brings the visitor back here rather than to the dashboard. */
const LOGIN_URL = `${API_URL}/auth/login?redirect=/contact`;

interface ContactForm {
  subject: string;
  guildId: string;
  message: string;
}

const EMPTY_FORM: ContactForm = { subject: "question", guildId: "", message: "" };

/** Fills the {placeholders} of a translated sentence with nodes, so a link can sit inside it. */
function rich(text: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return text.split(/(\{\w+\})/).map((part, index) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={index}>{name ? (nodes[name] ?? part) : part}</Fragment>;
  });
}

function errorMessage(error: unknown, t: Translator): string {
  return error instanceof ApiError && error.status < 500 && !error.generic
    ? error.message
    : t("common.state.error");
}

/** Sign-in invitation, shown until the Discord identity is available. */
function LoginPrompt({ reason, t }: { reason: "anonymous" | "noEmail"; t: Translator }) {
  return (
    <div className="card contact-form">
      <h2 style={{ marginTop: 0 }}>{t(`account.contact.signIn.${reason}.title`)}</h2>
      <p className="text-muted">{t(`account.contact.signIn.${reason}.body`)}</p>
      <a className="button-primary" href={LOGIN_URL}>
        {t(`account.contact.signIn.${reason}.action`)}
      </a>
    </div>
  );
}

export default function ContactPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [guilds, setGuilds] = useState<ManageableGuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const t = useTranslation();
  const locale = useLocale();

  useEffect(() => {
    let cancelled = false;

    // A missing session is not an error here: the page simply offers to sign in. The server list
    // follows the session, so it fails along with it, without consequence.
    void Promise.allSettled([api.get<Session>("/auth/me"), api.get<ManageableGuild[]>("/guilds")])
      .then(([me, guildList]) => {
        if (cancelled) return;
        if (me.status === "fulfilled") setSession(me.value);
        if (guildList.status === "fulfilled") setGuilds(guildList.value);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function update(patch: Partial<ContactForm>): void {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
  }

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    if (form.message.trim().length < MESSAGE_MIN) {
      setError(t("account.contact.message.tooShort", { min: MESSAGE_MIN }));
      return;
    }

    setPending(true);
    setError(null);
    try {
      await api.post("/contact", {
        subject: form.subject,
        guildId: form.guildId,
        message: form.message.trim(),
      });
      setSent(true);
      setForm(EMPTY_FORM);
    } catch (submitError) {
      setError(errorMessage(submitError, t));
    } finally {
      setPending(false);
    }
  }

  // Servers where Gaulia runs come first: those are the ones we can actually talk about.
  const withBot = guilds.filter((guild) => guild.botPresent);
  const withoutBot = guilds.filter((guild) => !guild.botPresent);

  return (
    <div className="container">
      <p>
        <Link href="/" className="text-muted">
          ← {t("account.contact.back")}
        </Link>
      </p>

      <h1>{t("account.contact.title")}</h1>
      <p className="text-muted contact-intro">
        {rich(t("account.contact.intro"), {
          myData: <Link href="/my-data">{t("account.contact.myDataLink")}</Link>,
        })}
        {SUPPORT_INVITE && (
          <>
            {" "}
            {rich(t("account.contact.support"), {
              support: (
                <a href="/support" target="_blank" rel="noopener noreferrer">
                  {t("account.contact.supportLink")}
                </a>
              ),
            })}
          </>
        )}
      </p>

      {loading && <p className="text-muted">{t("common.state.loading")}</p>}
      {!loading && !session && <LoginPrompt reason="anonymous" t={t} />}
      {!loading && session && !session.email && <LoginPrompt reason="noEmail" t={t} />}

      {!loading && session?.email && (
        <form className="card contact-form" onSubmit={(event) => void submit(event)} noValidate>
          <div className="contact-identity">
            <img
              src={userAvatarUrl(session.userId, session.avatar, 64)}
              alt=""
              width={44}
              height={44}
              className="contact-avatar"
            />
            <div>
              <strong>{session.username}</strong>
              <p className="text-muted">{session.email}</p>
            </div>
          </div>
          <p className="field-hint contact-identity-hint">{t("account.contact.identityHint")}</p>

          <div className="contact-row">
            <div className="field">
              <label htmlFor="contact-subject">{t("account.contact.subject.label")}</label>
              <select
                id="contact-subject"
                className="select"
                value={form.subject}
                onChange={(event) => update({ subject: event.target.value })}
              >
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {t(`account.contact.subject.${subject}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="contact-guild">{t("account.contact.guild.label")}</label>
              <select
                id="contact-guild"
                className="select"
                value={form.guildId}
                onChange={(event) => update({ guildId: event.target.value })}
              >
                <option value="">{t("account.contact.guild.none")}</option>
                {withBot.length > 0 && (
                  <optgroup label={t("account.contact.guild.withBot")}>
                    {withBot.map((guild) => (
                      <option key={guild.id} value={guild.id}>
                        {guild.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {withoutBot.length > 0 && (
                  <optgroup label={t("account.contact.guild.withoutBot")}>
                    {withoutBot.map((guild) => (
                      <option key={guild.id} value={guild.id} className="option-muted">
                        {guild.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="contact-message">{t("account.contact.message.label")}</label>
            <textarea
              id="contact-message"
              className="input contact-textarea"
              rows={8}
              maxLength={MESSAGE_MAX}
              required
              value={form.message}
              onChange={(event) => update({ message: event.target.value })}
            />
            <p className="field-hint">
              {t("account.contact.message.counter", {
                length: formatNumber(form.message.trim().length, locale),
                max: formatNumber(MESSAGE_MAX, locale),
              })}
            </p>
          </div>

          <div className="toolbar" style={{ margin: 0 }}>
            <button type="submit" className="button-primary" disabled={pending}>
              {pending ? t("account.contact.sending") : t("account.contact.submit")}
            </button>
            <span className="text-muted contact-note">
              {rich(t("account.contact.note"), {
                privacy: <Link href="/privacy">{t("account.contact.privacyLink")}</Link>,
              })}
            </span>
          </div>

          {error && (
            <p className="notice notice-error" role="alert">
              {error}
            </p>
          )}
          {sent && (
            <p className="notice notice-success" role="status">
              {t("account.contact.sent", { email: session.email })}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
