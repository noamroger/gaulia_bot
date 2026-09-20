"use client";

import Link from "next/link";
import { useState } from "react";

import { api, ApiError } from "@/lib/api";
import { SUPPORT_INVITE } from "@/lib/config";

const SUBJECTS = [
  { value: "question", label: "Question générale" },
  { value: "bug", label: "Signaler un bug" },
  { value: "premium", label: "Premium et crédits" },
  { value: "data", label: "Données personnelles (RGPD)" },
  { value: "other", label: "Autre" },
];

const MESSAGE_MIN = 20;
const MESSAGE_MAX = 4000;

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  discordTag: string;
  guildId: string;
  message: string;
  /** Champ piège : caché aux humains, rempli par les robots (voir apps/api/.../contact.routes.ts). */
  website: string;
}

const EMPTY_FORM: ContactForm = {
  name: "",
  email: "",
  subject: "question",
  discordTag: "",
  guildId: "",
  message: "",
  website: "",
};

/** Mêmes règles que la validation de l'API, pour corriger avant l'envoi plutôt qu'après. */
function formError(form: ContactForm): string | null {
  if (form.name.trim().length < 2) return "Indique un nom ou un pseudo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Adresse e-mail invalide.";
  if (form.guildId.trim() && !/^\d{17,20}$/.test(form.guildId.trim())) {
    return "L'identifiant du serveur doit être une suite de 17 à 20 chiffres.";
  }
  if (form.message.trim().length < MESSAGE_MIN) {
    return `Le message doit faire au moins ${MESSAGE_MIN} caractères.`;
  }
  return null;
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function update(patch: Partial<ContactForm>): void {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
  }

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    const invalid = formError(form);
    if (invalid) {
      setError(invalid);
      return;
    }

    setPending(true);
    setError(null);
    try {
      await api.post("/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject,
        discordTag: form.discordTag.trim(),
        guildId: form.guildId.trim(),
        message: form.message.trim(),
        website: form.website,
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
        l&apos;adresse indiquée.
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

      <form className="card contact-form" onSubmit={(event) => void submit(event)} noValidate>
        <div className="contact-row">
          <div className="field">
            <label htmlFor="contact-name">Nom ou pseudo</label>
            <input
              id="contact-name"
              className="input"
              type="text"
              autoComplete="name"
              maxLength={80}
              required
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="contact-email">Adresse e-mail</label>
            <input
              id="contact-email"
              className="input"
              type="email"
              autoComplete="email"
              maxLength={180}
              required
              value={form.email}
              onChange={(event) => update({ email: event.target.value })}
            />
          </div>
        </div>

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
            <label htmlFor="contact-discord">Identifiant Discord (facultatif)</label>
            <input
              id="contact-discord"
              className="input"
              type="text"
              maxLength={80}
              placeholder="pseudo"
              value={form.discordTag}
              onChange={(event) => update({ discordTag: event.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="contact-guild">Identifiant du serveur concerné (facultatif)</label>
          <input
            id="contact-guild"
            className="input"
            type="text"
            inputMode="numeric"
            maxLength={20}
            placeholder="123456789012345678"
            value={form.guildId}
            onChange={(event) => update({ guildId: event.target.value })}
          />
          <p className="field-hint">
            Clic droit sur le serveur dans Discord &gt; « Copier l&apos;identifiant du serveur »,
            avec le mode développeur activé.
          </p>
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

        {/* Piège à robots : hors flux et hors tabulation, invisible pour un visiteur. */}
        <div className="contact-trap" aria-hidden="true">
          <label htmlFor="contact-website">Ne pas remplir</label>
          <input
            id="contact-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => update({ website: event.target.value })}
          />
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
            Message envoyé. Une réponse arrivera à l&apos;adresse indiquée.
          </p>
        )}
      </form>
    </div>
  );
}
