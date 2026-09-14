import path from "node:path";

import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// __dirname ici = packages/database (2 niveaux sous la racine du monorepo, où vit le .env partagé).
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
