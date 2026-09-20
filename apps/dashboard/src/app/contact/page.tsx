"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { API_URL, SUPPORT_INVITE } from "@/lib/config";
import { userAvatarUrl } from "@/lib/discordCdn";
import type { ManageableGuild, Session } from "@/lib/types";

const SUBJECTS = [
  { value: "question", label: "Question générale" },
  { value: "bug", label: "Signaler un bug" },
  { value: "premium", label: "Premium et crédits" },
  { value: "data", label: "Données personnelles (RGPD)" },
  { value: "other", label: "Autre" },
];

const MESSAGE_MIN = 20;
const MESSAGE_MAX = 4000;
/** La connexion repasse par l'API, qui ramène ici plutôt que sur le tableau de bord. */
const LOGIN_URL = `${API_URL}/auth/login?redirect=/contact`;

interface ContactForm {
  subject: string;
  guildId: string;
  message: string;
}

const EMPTY_FORM: ContactForm = { subject: "question", guildId: "", message: "" };

/** Invitation à se connecter, affichée tant que l'identité Discord n'est pas disponible. */
function LoginPrompt({ reason }: { reason: "anonymous" | "no-email" }) {
  return (
    <div className="card contact-form">
      <h2 style={{ marginTop: 0 }}>
        {reason === "anonymous" ? "Connecte-toi pour nous écrire" : "Une autorisation en plus"}
      </h2>
      <p className="text-muted">
        {reason === "anonymous" ? (
          <>
            Le formulaire passe par ton compte Discord : ton pseudo, ton identifiant et
            l&apos;adresse de ton compte accompagnent le message. Tu n&apos;as donc rien à saisir,
            et la réponse part à la bonne personne.
          </>
        ) : (
          <>
            Ta session date d&apos;avant que nous demandions l&apos;accès à ton adresse Discord, ou
            ton compte n&apos;a pas d&apos;adresse vérifiée. Reconnecte-toi pour autoriser son
            partage : c&apos;est elle qui nous permet de te répondre.
          </>
        )}
      </p>
      <a className="button-primary" href={LOGIN_URL}>
        {reason === "anonymous" ? "Se connecter avec Discord" : "Se reconnecter"}
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

  useEffect(() => {
    let cancelled = false;

    // Une session absente n'est pas une erreur ici : la page propose simplement de se connecter.
    // La liste des serveurs suit la session, donc elle échoue aussi sans elle - sans conséquence.
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
      setError(`Le message doit faire au moins ${MESSAGE_MIN} caractères.`);
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
      setError(
        submitError instanceof ApiError && submitError.status < 500
          ? submitError.message
          : "L'envoi a échoué. Réessaie dans quelques instants.",
      );
    } finally {
      setPending(false);
    }
  }

  // Les serveurs où Gaulia tourne d'abord : ce sont ceux dont on peut réellement parler.
  const withBot = guilds.filter((guild) => guild.botPresent);
  const withoutBot = guilds.filter((guild) => !guild.botPresent);

  return (
    <div className="container">
      <p>
        <Link href="/" className="text-muted">
          ← Retour à l&apos;accueil
        </Link>
      </p>

      <h1>Nous contacter</h1>
      <p className="text-muted contact-intro">
        Une question, un bug, une demande sur tes données ? Écris ici, la réponse arrivera à
        l&apos;adresse de ton compte Discord. Pour voir, télécharger ou supprimer tes données
        toi-même, la page <Link href="/my-data">Mes données</Link> le fait sans attendre de réponse.
        {SUPPORT_INVITE && (
          <>
            {" "}
            Pour une aide rapide, le{" "}
            <a href="/support" target="_blank" rel="noopener noreferrer">
              serveur de support
            </a>{" "}
            est souvent plus direct.
          </>
        )}
      </p>

      {loading && <p className="text-muted">Chargement…</p>}
      {!loading && !session && <LoginPrompt reason="anonymous" />}
      {!loading && session && !session.email && <LoginPrompt reason="no-email" />}

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
          <p className="field-hint contact-identity-hint">
            Ton pseudo, ton identifiant Discord et cette adresse accompagnent le message. Ce
            n&apos;est pas modifiable ici : tout vient de ta session.
          </p>

          <div className="contact-row">
            <div className="field">
              <label htmlFor="contact-subject">Sujet</label>
              <select
                id="contact-subject"
                className="select"
                value={form.subject}
                onChange={(event) => update({ subject: event.target.value })}
              >
                {SUBJECTS.map((subject) => (
                  <option key={subject.value} value={subject.value}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="contact-guild">Serveur concerné (facultatif)</label>
              <select
                id="contact-guild"
                className="select"
                value={form.guildId}
                onChange={(event) => update({ guildId: event.target.value })}
              >
                <option value="">Aucun en particulier</option>
                {withBot.length > 0 && (
                  <optgroup label="Avec Gaulia">
                    {withBot.map((guild) => (
                      <option key={guild.id} value={guild.id}>
                        {guild.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {withoutBot.length > 0 && (
                  <optgroup label="Sans Gaulia">
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
            <label htmlFor="contact-message">Message</label>
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
              {form.message.trim().length} / {MESSAGE_MAX} caractères
            </p>
          </div>

          <div className="toolbar" style={{ margin: 0 }}>
            <button type="submit" className="button-primary" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer le message"}
            </button>
            <span className="text-muted contact-note">
              Ton adresse ne sert qu&apos;à te répondre.{" "}
              <Link href="/privacy">Politique de confidentialité</Link>
            </span>
          </div>

          {error && (
            <p className="notice notice-error" role="alert">
              {error}
            </p>
          )}
          {sent && (
            <p className="notice notice-success" role="status">
              Message envoyé. Une réponse arrivera à {session.email}.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
