import path from "node:path";

import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// __dirname here = packages/database, two levels under the monorepo root where the shared .env lives.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
