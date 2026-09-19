import nodemailer, { type Transporter } from "nodemailer";

import { env } from "../config/env";

let transporter: Transporter | null = null;

/**
 * Vrai seulement si l'envoi peut réellement aboutir. Sans serveur, expéditeur ou destinataire,
 * la route de contact répond 503 plutôt que de laisser croire à un message parti.
 */
export function isMailConfigured(): boolean {
  return env.SMTP_HOST !== "" && env.SMTP_FROM !== "" && env.CONTACT_EMAIL_TO !== "";
}

/** Transport créé à la première utilisation, puis réutilisé (pool de connexions nodemailer). */
function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    // Un relais local peut ne demander aucune authentification.
    ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } } : {}),
  });
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
