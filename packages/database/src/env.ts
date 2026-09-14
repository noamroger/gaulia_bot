import path from "node:path";

import dotenv from "dotenv";
import { z } from "zod";

// `__dirname` est ici `packages/database/src` (tsx, dev) ou `packages/database/dist` (compilé) —
// dans les deux cas 3 niveaux sous la racine du monorepo, où vit le `.env` partagé par tous les
// workspaces. En Docker les variables sont déjà injectées par docker-compose, donc l'absence de
// fichier ici (chemin inexistant) est un no-op silencieux pour dotenv.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

/**
 * Variables d'env propres au package base de données (partagé par le bot et l'API, qui ont
 * chacun leurs propres variables par ailleurs — voir apps/bot/src/config/env.ts et
 * apps/api/src/config/env.ts).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
