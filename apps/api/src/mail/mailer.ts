import nodemailer, { type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { env } from "../config/env";

let transporter: Transporter | null = null;

/**
 * Vrai seulement si l'envoi peut réellement aboutir. Sans serveur, expéditeur ou destinataire,
 * la route de contact répond 503 plutôt que de laisser croire à un message parti.
 */
export function isMailConfigured(): boolean {
  return env.SMTP_HOST !== "" && env.SMTP_FROM !== "" && env.CONTACT_EMAIL_TO !== "";
}

/** Port du TLS implicite : la connexion est chiffrée d'emblée, sans passer par STARTTLS. */
const IMPLICIT_TLS_PORT = 465;

/**
 * Options de connexion au serveur SMTP. `secure` se déduit du port et non de `SMTP_TLS` : sur le
 * 587, le dialogue commence en clair puis bascule en TLS via STARTTLS - annoncer `secure: true`
 * ferait attendre une poignée de main TLS que le serveur n'entamera jamais, et la connexion
 * resterait bloquée. `SMTP_TLS` sert donc à *exiger* le chiffrement (`requireTLS`), ce qui fait
 * échouer l'envoi plutôt que de le laisser partir en clair si le serveur ne propose pas STARTTLS.
 */
export function smtpOptions(): SMTPTransport.Options {
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // Sans ces bornes, un serveur injoignable ou muet laisse la requête HTTP en attente plusieurs
    // minutes (nodemailer patiente très longtemps par défaut) : mieux vaut échouer vite et
    // afficher au visiteur que l'envoi n'a pas abouti.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    secure: env.SMTP_PORT === IMPLICIT_TLS_PORT,
    requireTLS: env.SMTP_TLS && env.SMTP_PORT !== IMPLICIT_TLS_PORT,
    // Un relais local peut ne demander aucune authentification.
    ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {}),
  };
}

/** Transport créé à la première utilisation, puis réutilisé (pool de connexions nodemailer). */
function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport(smtpOptions());
  return transporter;
}

export interface OutgoingMail {
  subject: string;
  text: string;
  html: string;
  /** Adresse à laquelle « Répondre » doit écrire, ici l'auteur du message. */
  replyTo?: string;
}

/** Envoie un message à l'adresse de contact du bot. À n'appeler qu'après `isMailConfigured()`. */
export async function sendContactMail(mail: OutgoingMail): Promise<void> {
  await getTransporter().sendMail({
    from: env.SMTP_FROM,
    to: env.CONTACT_EMAIL_TO,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
  });
}
