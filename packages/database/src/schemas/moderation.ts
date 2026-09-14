import { z } from "zod";

import { MAX_TIMEOUT_MINUTES } from "./automod";

export const ESCALATION_ACTIONS = ["timeout", "kick", "ban"] as const;

export const escalationStepSchema = z.object({
  warnCount: z.number().int().min(1).max(50),
  action: z.enum(ESCALATION_ACTIONS),
  timeoutMinutes: z.number().int().min(1).max(MAX_TIMEOUT_MINUTES).default(60),
});
export type EscalationStep = z.infer<typeof escalationStepSchema>;

export const warnEscalationSchema = z
  .array(escalationStepSchema)
  .max(10)
  .refine((steps) => new Set(steps.map((step) => step.warnCount)).size === steps.length, {
    message: "Chaque palier doit avoir un nombre d'avertissements différent.",
  })
  .transform((steps) => [...steps].sort((a, b) => a.warnCount - b.warnCount));

export function parseWarnEscalation(value: unknown): EscalationStep[] {
  const parsed = warnEscalationSchema.safeParse(value ?? []);
  return parsed.success ? parsed.data : [];
}
