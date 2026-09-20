import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { contactHtml, contactSubject, contactText } from "../mail/contactEmail";
import { isMailConfigured, sendContactMail } from "../mail/mailer";
import { authenticate } from "../plugins/authenticate";

/** Sujets proposés par le formulaire ; le libellé part tel quel dans l'objet du mail. */
const SUBJECTS = {
  question: "Question générale",
  bug: "Signalement de bug",
  premium: "Premium et crédits",
  data: "Données personnelles (RGPD)",
  other: "Autre",
} as const;

const MINUTE_MS = 60_000;
/** Fenêtre et quota par compte : de quoi écrire plusieurs fois sans ouvrir un robinet à spam. */
const USER_WINDOW_MS = 15 * MINUTE_MS;
const USER_LIMIT = 3;
/** Garde-fou global, tous comptes confondus, sur une heure glissante. */
const GLOBAL_WINDOW_MS = 60 * MINUTE_MS;
const GLOBAL_LIMIT = 40;

const contactSchema = z.object({
  subject: z.enum(["question", "bug", "premium", "data", "other"]),
  guildId: z
    .string()
    .trim()
    .default("")
    .refine(
      (value) => value === "" || /^\d{17,20}$/.test(value),
      "Identifiant de serveur invalide",
    ),
  message: z.string().trim().min(20, "Message trop court").max(4000),
});

/** Horodatages des envois récents, en mémoire : l'API tourne dans un seul process. */
const recentByUser = new Map<string, number[]>();
let recentGlobal: number[] = [];

function keep(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((at) => now - at < windowMs);
}

function isRateLimited(userId: string): boolean {
  const now = Date.now();

  recentGlobal = keep(recentGlobal, GLOBAL_WINDOW_MS, now);
  if (recentGlobal.length >= GLOBAL_LIMIT) return true;

  const forUser = keep(recentByUser.get(userId) ?? [], USER_WINDOW_MS, now);
  if (forUser.length >= USER_LIMIT) {
    recentByUser.set(userId, forUser);
    return true;
  }

  forUser.push(now);
  recentByUser.set(userId, forUser);
  recentGlobal.push(now);

  // Les comptes inactifs ne restent pas en mémoire indéfiniment.
  for (const [key, values] of recentByUser) {
    if (keep(values, USER_WINDOW_MS, now).length === 0) recentByUser.delete(key);
  }

  return false;
}

/**
 * Formulaire de contact, réservé aux comptes Discord connectés : l'identité (pseudo, identifiant,
 * avatar) et l'adresse de réponse viennent de la session, jamais de champs saisis. Personne ne
 * peut donc écrire au nom d'un autre, ni laisser une adresse fantaisiste.
 */
export default async function contactRoutes(app: FastifyInstance): Promise<void> {
  app.post("/contact", { preHandler: authenticate }, async (request, reply) => {
    if (!isMailConfigured()) {
      return reply.status(503).send({
        error: "L'envoi de messages est momentanément indisponible.",
      });
    }

    const { userId, username, avatar, email } = request.user;

    // Session ouverte avant l'ajout du scope `email`, ou compte sans adresse vérifiée.
    if (!email) {
      return reply.status(403).send({
        error:
          "Ton adresse Discord n'est pas disponible. Reconnecte-toi pour autoriser son partage, ou vérifie l'adresse de ton compte Discord.",
      });
    }

    const parsed = contactSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
      });
    }

    if (isRateLimited(userId)) {
      return reply.status(429).send({
        error: "Trop de messages envoyés. Réessaie dans quelques minutes.",
      });
    }

    const data = parsed.data;
    const message = {
      userId,
      username,
      avatar,
      email,
      subjectLabel: SUBJECTS[data.subject],
      guildId: data.guildId,
      message: data.message,
      receivedAt: new Date(),
    };

    await sendContactMail({
      subject: contactSubject(message),
      text: contactText(message),
      html: contactHtml(message),
      replyTo: email,
    });

    request.log.info({ userId, subject: data.subject }, "Message du formulaire de contact envoyé");
    return { sent: true };
  });
}
