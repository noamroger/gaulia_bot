import path from "node:path";

import dotenv from "dotenv";
import { z } from "zod";

// Under tsx (src) as well as compiled (dist), `__dirname` sits 3 levels below the monorepo root,
// where the `.env` shared by every workspace lives. In Docker the variables are already injected
// by docker-compose, so a missing file here is a silent no-op for dotenv.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

/** Env variables owned by the database package; the bot and the API have their own on top. */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
