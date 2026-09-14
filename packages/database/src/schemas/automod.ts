import { z } from "zod";

export const SANCTION_TYPES = ["delete", "warn", "timeout", "kick", "ban"] as const;
export type SanctionType = (typeof SANCTION_TYPES)[number];

/** Durée maximale d'un timeout imposée par Discord. */
export const MAX_TIMEOUT_MINUTES = 28 * 24 * 60;

export const sanctionSchema = z.object({
  type: z.enum(SANCTION_TYPES).default("delete"),
  timeoutMinutes: z.number().int().min(1).max(MAX_TIMEOUT_MINUTES).default(10),
});
export type Sanction = z.infer<typeof sanctionSchema>;

/** "https://www.Exemple.com/page" → "exemple.com". */
export function normalizeDomain(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/^[a-z]+:\/\//, "")
      .replace(/^www\./, "")
      .split(/[/?#:]/)[0] ?? ""
  );
}

const domainSchema = z
  .string()
  .max(253)
  .transform(normalizeDomain)
  .refine((domain) => /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(domain), { message: "Domaine invalide." });

function uniqueList<T extends z.ZodType<string, z.ZodTypeDef, string>>(item: T, max: number) {
  return z
    .array(item)
    .max(max)
    .default([])
    .transform((values) => [...new Set(values)]);
}

const enabled = z.boolean().default(false);

export const automodRulesSchema = z.object({
  links: z
    .object({
      enabled,
      mode: z.enum(["blocklist", "allowlist"]).default("blocklist"),
      domains: uniqueList(domainSchema, 200),
      action: sanctionSchema.default({}),
    })
    .default({}),
  invites: z
    .object({
      enabled,
      allowedInvites: uniqueList(z.string().trim().min(1).max(100), 50),
      action: sanctionSchema.default({}),
    })
    .default({}),
  badWords: z
    .object({
      enabled,
      words: uniqueList(z.string().trim().toLowerCase().min(1).max(50), 500),
      action: sanctionSchema.default({}),
    })
    .default({}),
  mentions: z
    .object({
      enabled,
      maxMentions: z.number().int().min(1).max(50).default(5),
      action: sanctionSchema.default({ type: "timeout", timeoutMinutes: 10 }),
    })
    .default({}),
  caps: z
    .object({
      enabled,
      percent: z.number().int().min(50).max(100).default(70),
      minLength: z.number().int().min(5).max(200).default(10),
      action: sanctionSchema.default({}),
    })
    .default({}),
  duplicates: z
    .object({
      enabled,
      maxRepeats: z.number().int().min(2).max(10).default(3),
      action: sanctionSchema.default({}),
    })
    .default({}),
  flood: z
    .object({
      enabled,
      maxMessages: z.number().int().min(2).max(30).default(5),
      perSeconds: z.number().int().min(2).max(60).default(5),
      action: sanctionSchema.default({ type: "timeout", timeoutMinutes: 5 }),
    })
    .default({}),
});
export type AutomodRules = z.infer<typeof automodRulesSchema>;

/** Complète les options manquantes avec leurs valeurs par défaut (JSON stocké en base). */
export function parseAutomodRules(value: unknown): AutomodRules {
  const parsed = automodRulesSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : automodRulesSchema.parse({});
}
