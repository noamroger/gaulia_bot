import nodemailer, { type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { env } from "../config/env";

let transporter: Transporter | null = null;

/**
 * True only when a send can actually go through. Without a server, a sender or a recipient, the
 * contact route answers 503 rather than letting anyone believe a mail left.
 */
export function isMailConfigured(): boolean {
  return env.SMTP_HOST !== "" && env.SMTP_FROM !== "" && env.CONTACT_EMAIL_TO !== "";
}

/** Implicit TLS port: the connection is encrypted from the start, without STARTTLS. */
const IMPLICIT_TLS_PORT = 465;

/**
 * SMTP connection options. `secure` follows the port, not `SMTP_TLS`: on 587 the dialogue starts
 * in the clear then upgrades through STARTTLS, so announcing `secure: true` would wait for a TLS
 * handshake the server never starts and the connection would hang. `SMTP_TLS` therefore *requires*
 * encryption (`requireTLS`), which fails the send instead of letting it leave unencrypted when the
 * server offers no STARTTLS.
 */
export function smtpOptions(): SMTPTransport.Options {
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // Without these bounds, an unreachable or silent server leaves the HTTP request hanging for
    // minutes (nodemailer waits a very long time by default): better to fail fast and tell the
    // visitor the message did not go out.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    secure: env.SMTP_PORT === IMPLICIT_TLS_PORT,
    requireTLS: env.SMTP_TLS && env.SMTP_PORT !== IMPLICIT_TLS_PORT,
    // A local relay may ask for no authentication at all.
    ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {}),
  };
}

/** Transport built on first use, then reused (nodemailer connection pool). */
function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport(smtpOptions());
  return transporter;
}

export interface OutgoingMail {
  subject: string;
  text: string;
  html: string;
  /** Address that "Reply" must write to, here the author of the message. */
  replyTo?: string;
}

/** Sends a message to the bot contact address. Only call it after `isMailConfigured()`. */
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
