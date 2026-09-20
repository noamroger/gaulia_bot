import path from "node:path";

import dotenv from "dotenv";
import { z } from "zod";

// __dirname ici = apps/api/src/config (dev, tsx) ou apps/api/dist/config (compilé) — dans les
// deux cas 4 niveaux sous la racine du monorepo, où vit le .env partagé. En Docker les variables
// sont déjà injectées par docker-compose (no-op silencieux ici).
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const envSchema = z.object({
  DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID est requis"),
  // Même token que le bot : sert à lister les salons et rôles d'un serveur pour le dashboard.
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN est requis"),
  DISCORD_CLIENT_SECRET: z.string().min(1, "DISCORD_CLIENT_SECRET est requis pour l'OAuth2"),
  DISCORD_REDIRECT_URI: z
    .string()
    .url()
    .min(1, "DISCORD_REDIRECT_URI est requis (ex: http://localhost:4000/auth/callback)"),

  DASHBOARD_URL: z.string().url().min(1, "DASHBOARD_URL est requis (ex: http://localhost:3000)"),

  // Même variable que côté bot : ID(s) Discord du/des propriétaire(s), séparés par des virgules.
  // Détermine qui a accès au panel admin (/admin) une fois connecté.
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

  JWT_SECRET: z.string().min(16, "JWT_SECRET doit faire au moins 16 caractères"),

  // Secret de l'intégration webhook top.gg (page du bot > Integrations & API > Webhooks) : sert à
  // vérifier la signature des votes reçus sur POST /topgg/webhook. Vide = endpoint désactivé
  // (il répond 503), pour ne jamais créditer sur la foi d'une requête non vérifiée.
  TOPGG_WEBHOOK_SECRET: z.string().optional().default(""),

  // Envoi des messages du formulaire de contact (POST /contact). Tout est optionnel : sans
  // configuration complète, la route répond 503 au lieu de prétendre avoir envoyé un mail.
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  // Exiger le chiffrement de la connexion. Ce n'est PAS le `secure` de nodemailer, qui désigne le
  // TLS implicite du port 465 : sur le port 587 la connexion s'ouvre en clair puis passe en TLS
  // par STARTTLS. Le mode se déduit donc du port, et cette variable rend le chiffrement obligatoire.
  SMTP_TLS: z
    .string()
    .optional()
    .default("true")
    .transform((value) => value !== "false"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  // Expéditeur des mails. À défaut, l'adresse de contact elle-même : un formulaire qui s'envoie à
  // lui-même part d'un domaine déjà vérifié chez le fournisseur SMTP, donc délivrable.
  SMTP_FROM: z.string().optional().default(""),
  // Destinataire des messages. À défaut, l'adresse de contact publique déjà présente dans le .env.
  CONTACT_EMAIL_TO: z.string().optional().default(""),
  NEXT_PUBLIC_CONTACT_EMAIL: z.string().optional().default(""),

  API_PORT: z.coerce.number().int().positive().default(4000),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

const parsed = envSchema.parse(process.env);

/**
 * Le formulaire de contact n'a besoin que des identifiants SMTP : l'expéditeur et le destinataire
 * retombent sur l'adresse de contact publique, déjà configurée pour la page de confidentialité et
 * le pied de page. Une seule variable à renseigner au lieu de trois.
 */
const contactTo = parsed.CONTACT_EMAIL_TO || parsed.NEXT_PUBLIC_CONTACT_EMAIL;

export const env = {
  ...parsed,
  CONTACT_EMAIL_TO: contactTo,
  SMTP_FROM: parsed.SMTP_FROM || contactTo,
};
