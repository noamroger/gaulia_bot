import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import { contactHtml, contactSubject, contactText } from "../mail/contactEmail";
import { isMailConfigured, sendContactMail } from "../mail/mailer";

/** Sujets proposés par le formulaire ; le libellé part tel quel dans l'objet du mail. */
const SUBJECTS = {
  question: "Question générale",
  bug: "Signalement de bug",
  premium: "Premium et crédits",
  data: "Données personnelles (RGPD)",
  other: "Autre",
} as const;

const MINUTE_MS = 60_000;
/** Fenêtre et quota par adresse IP : de quoi écrire plusieurs fois sans ouvrir un robinet à spam. */
const IP_WINDOW_MS = 15 * MINUTE_MS;
const IP_LIMIT = 3;
/** Garde-fou global, tous visiteurs confondus, sur une heure glissante. */
const GLOBAL_WINDOW_MS = 60 * MINUTE_MS;
const GLOBAL_LIMIT = 40;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(80),
  email: z.string().trim().email("Adresse e-mail invalide").max(180),
  subject: z.enum(["question", "bug", "premium", "data", "other"]),
  discordTag: z.string().trim().max(80).default(""),
  guildId: z
    .string()
    .trim()
    .default("")
    .refine(
      (value) => value === "" || /^\d{17,20}$/.test(value),
      "Identifiant de serveur invalide",
    ),
  message: z.string().trim().min(20, "Message trop court").max(4000),
  /**
   * Champ piège, invisible et jamais rempli par un humain : un robot qui remplit tous les champs
   * du formulaire se trahit ici. Volontairement permissif à la validation pour que la requête
   * atteigne la branche qui répond « envoyé » sans rien envoyer : un 400 apprendrait au robot
   * quel champ éviter.
   */
  website: z.string().max(200).optional(),
});

/** Horodatages des envois récents, en mémoire : l'API tourne dans un seul process. */
const recentByIp = new Map<string, number[]>();
let recentGlobal: number[] = [];

function keep(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((at) => now - at < windowMs);
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  recentGlobal = keep(recentGlobal, GLOBAL_WINDOW_MS, now);
  if (recentGlobal.length >= GLOBAL_LIMIT) return true;

  const forIp = keep(recentByIp.get(ip) ?? [], IP_WINDOW_MS, now);
  if (forIp.length >= IP_LIMIT) {
    recentByIp.set(ip, forIp);
    return true;
  }

  forIp.push(now);
  recentByIp.set(ip, forIp);
  recentGlobal.push(now);

  // Les adresses inactives ne restent pas en mémoire indéfiniment.
  for (const [key, values] of recentByIp) {
    if (keep(values, IP_WINDOW_MS, now).length === 0) recentByIp.delete(key);
  }

  return false;
}

/**
 * Formulaire de contact public : valide la saisie, freine les envois répétés, puis transmet le
 * message par mail. Route ouverte (aucune session requise), d'où le piège à robots et les quotas.
 */
export default async function contactRoutes(app: FastifyInstance): Promise<void> {
  app.post("/contact", async (request: FastifyRequest, reply) => {
    if (!isMailConfigured()) {
      return reply.status(503).send({
        error: "L'envoi de messages est momentanément indisponible.",
      });
    }

    const parsed = contactSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
      });
    }

    const data = parsed.data;

    // Piège rempli : on répond comme si tout allait bien, sans rien envoyer.
    if (data.website) {
      request.log.warn({ ip: request.ip }, "Formulaire de contact : piège à robots déclenché");
      return { sent: true };
    }

    if (isRateLimited(request.ip)) {
      return reply.status(429).send({
        error: "Trop de messages envoyés depuis cette adresse. Réessaie dans quelques minutes.",
      });
    }

    const message = {
      name: data.name,
      email: data.email,
      subjectLabel: SUBJECTS[data.subject],
      discordTag: data.discordTag,
      guildId: data.guildId,
      message: data.message,
      receivedAt: new Date(),
    };

    await sendContactMail({
      subject: contactSubject(message),
      text: contactText(message),
      html: contactHtml(message),
      replyTo: data.email,
    });

    request.log.info({ subject: data.subject }, "Message du formulaire de contact envoyé");
    return { sent: true };
  });
}
