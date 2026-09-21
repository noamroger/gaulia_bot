import path from "node:path";

import dotenv from "dotenv";
import { z } from "zod";

// __dirname is apps/api/src/config (dev, tsx) or apps/api/dist/config (built): either way four
// levels under the monorepo root, where the shared .env lives. Docker injects the variables
// through docker-compose, so this call is then a silent no-op.
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const envSchema = z.object({
  DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID is required"),
  // Same token as the bot: used to list a server's channels and roles for the dashboard.
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
  DISCORD_CLIENT_SECRET: z.string().min(1, "DISCORD_CLIENT_SECRET is required for OAuth2"),
  DISCORD_REDIRECT_URI: z
    .string()
    .url()
    .min(1, "DISCORD_REDIRECT_URI is required (e.g. http://localhost:4000/auth/callback)"),

  DASHBOARD_URL: z.string().url().min(1, "DASHBOARD_URL is required (e.g. http://localhost:3000)"),

  // Same variable as the bot: Discord id(s) of the owner(s), comma separated. Decides who reaches
  // the admin panel (/admin) once signed in.
  OWNER_IDS: z
    .string()
    .optional()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),

  // Secret of the top.gg webhook integration (bot page > Integrations & API > Webhooks): verifies
  // the signature of votes posted to POST /topgg/webhook. Empty disables the endpoint (it answers
  // 503), so credits are never granted on an unverified request.
  TOPGG_WEBHOOK_SECRET: z.string().optional().default(""),

  // Delivery of the contact form (POST /contact). All optional: without a complete setup the
  // route answers 503 instead of pretending a mail went out.
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  // Require an encrypted connection. This is NOT nodemailer's `secure`, which means the implicit
  // TLS of port 465: on port 587 the connection opens in the clear then upgrades through STARTTLS.
  // The mode is therefore derived from the port, and this variable makes encryption mandatory.
  SMTP_TLS: z
    .string()
    .optional()
    .default("true")
    .transform((value) => value !== "false"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  // Sender of the mails. Defaults to the contact address itself: a form mailing itself leaves from
  // a domain already verified at the SMTP provider, hence deliverable.
  SMTP_FROM: z.string().optional().default(""),
  // Recipient of the messages. Defaults to the public contact address already in the .env.
  CONTACT_EMAIL_TO: z.string().optional().default(""),
  NEXT_PUBLIC_CONTACT_EMAIL: z.string().optional().default(""),

  API_PORT: z.coerce.number().int().positive().default(4000),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

const parsed = envSchema.parse(process.env);

/**
 * The contact form only needs the SMTP credentials: sender and recipient fall back to the public
 * contact address, already configured for the privacy page and the footer. One variable to fill
 * in instead of three.
 */
const contactTo = parsed.CONTACT_EMAIL_TO || parsed.NEXT_PUBLIC_CONTACT_EMAIL;

export const env = {
  ...parsed,
  CONTACT_EMAIL_TO: contactTo,
  SMTP_FROM: parsed.SMTP_FROM || contactTo,
};
