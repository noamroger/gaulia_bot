import path from "node:path";

import dotenv from "dotenv";
import { z } from "zod";

// __dirname ici = apps/bot/src/config (dev, tsx) ou apps/bot/dist/config (compilé) — dans les
// deux cas 4 niveaux sous la racine du monorepo, où vit le .env partagé par tous les workspaces.
// En Docker les variables sont déjà injectées par docker-compose (no-op silencieux ici).
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN est requis"),
  DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID est requis"),
  DISCORD_CLIENT_SECRET: z.string().optional(),
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
  DEV_GUILD_ID: z.string().optional(),

  TOTAL_SHARDS: z.string().optional().default("auto"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),

  LAVALINK_HOST: z.string().min(1),
  LAVALINK_PORT: z.coerce.number().int().positive(),
  LAVALINK_PASSWORD: z.string().min(1),
  LAVALINK_SECURE: z
    .string()
    .optional()
    .default("false")
    .transform((value) => value === "true"),

  PREMIUM_SKU_ID: z.string().optional().default(""),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Configuration invalide (.env) :\n${issues}`);
  }

  return parsed.data;
}

export const env = loadEnv();

export const totalShards: number | "auto" =
  env.TOTAL_SHARDS === "auto" ? "auto" : Number(env.TOTAL_SHARDS);
