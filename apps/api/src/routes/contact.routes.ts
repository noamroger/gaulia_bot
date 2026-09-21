import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { hasGuildAccess } from "../auth/session";
import { translatorFor } from "../i18n";
import { contactHtml, contactSubject, contactText } from "../mail/contactEmail";
import { isMailConfigured, sendContactMail } from "../mail/mailer";
import { authenticate } from "../plugins/authenticate";

const MINUTE_MS = 60_000;
/** Window and quota per account: room to write several times without opening a spam tap. */
const USER_WINDOW_MS = 15 * MINUTE_MS;
const USER_LIMIT = 3;
/** Global guard rail, all accounts together, over a sliding hour. */
const GLOBAL_WINDOW_MS = 60 * MINUTE_MS;
const GLOBAL_LIMIT = 40;

/** Schema messages are translation keys, so a rejected form reads in the caller's language. */
const contactSchema = z.object({
  subject: z.enum(["question", "bug", "premium", "data", "other"], {
    message: "errors.contact.invalidSubject",
  }),
  guildId: z
    .string()
    .trim()
    .default("")
    .refine((value) => value === "" || /^\d{17,20}$/.test(value), "errors.contact.invalidGuildId"),
  message: z
    .string()
    .trim()
    .min(20, "errors.contact.messageTooShort")
    .max(4000, "errors.contact.messageTooLong"),
});

/** Timestamps of the recent sends, in memory: the API runs in a single process. */
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

  // Idle accounts do not stay in memory forever.
  for (const [key, values] of recentByUser) {
    if (keep(values, USER_WINDOW_MS, now).length === 0) recentByUser.delete(key);
  }

  return false;
}

/** A schema message that is not one of our keys (a type error) falls back to the generic one. */
function issueKey(message: string | undefined): string {
  return message?.startsWith("errors.") ? message : "errors.contact.invalidForm";
}

/**
 * Contact form, restricted to signed-in Discord accounts: the identity (name, id, avatar) and the
 * reply address come from the session, never from typed fields. Nobody can write under someone
 * else's name, nor leave a made-up address.
 */
export default async function contactRoutes(app: FastifyInstance): Promise<void> {
  app.post("/contact", { preHandler: authenticate }, async (request, reply) => {
    if (!isMailConfigured()) {
      return reply.status(503).send({ error: request.t("errors.contact.unavailable") });
    }

    const { userId, username, avatar, email } = request.user;

    // Session opened before the `email` scope, or account without a verified address.
    if (!email) {
      return reply.status(403).send({ error: request.t("errors.contact.missingEmail") });
    }

    const parsed = contactSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: request.t(issueKey(parsed.error.issues[0]?.message)) });
    }

    // The field is a dropdown on the dashboard, but nothing stops a caller from sending something
    // else: any server this account does not manage is refused rather than copied into the mail.
    if (parsed.data.guildId && !hasGuildAccess(request.user, parsed.data.guildId)) {
      return reply.status(403).send({ error: request.t("errors.guild.notManaged") });
    }

    if (isRateLimited(userId)) {
      return reply.status(429).send({ error: request.t("errors.contact.rateLimited") });
    }

    const data = parsed.data;
    // The name makes the mail readable; it comes from the session, hence from Discord.
    const guild = request.user.manageableGuilds.find((entry) => entry.id === data.guildId);

    const contactMessage = {
      userId,
      username,
      avatar,
      email,
      subjectId: data.subject,
      guildId: data.guildId,
      guildName: guild?.name ?? "",
      message: data.message,
      receivedAt: new Date(),
    };

    // This mail is read by the team, so it is written in English; anything addressed to the person
    // who wrote uses `request.t`.
    const teamTranslator = translatorFor("en");

    await sendContactMail({
      subject: contactSubject(teamTranslator, contactMessage),
      text: contactText(teamTranslator, contactMessage),
      html: contactHtml(teamTranslator, contactMessage),
      replyTo: email,
    });

    request.log.info({ userId, subject: data.subject }, "Contact form message sent");
    return { sent: true };
  });
}
