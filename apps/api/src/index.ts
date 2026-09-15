import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import Fastify from "fastify";

import "./auth/session";
import { env } from "./config/env";
import { startRetentionJob } from "./jobs/retentionJob";
import { logger } from "./logger";
import adminRoutes from "./routes/admin.routes";
import adventureRoutes from "./routes/adventure.routes";
import automodRoutes from "./routes/automod.routes";
import authRoutes from "./routes/auth.routes";
import blindtestRoutes from "./routes/blindtest.routes";
import creditsRoutes from "./routes/credits.routes";
import guildsRoutes from "./routes/guilds.routes";
import premiumRoutes from "./routes/premium.routes";
import settingsRoutes from "./routes/settings.routes";
import statsRoutes from "./routes/stats.routes";
import topggRoutes from "./routes/topgg.routes";

async function main(): Promise<void> {
  const app = Fastify({ loggerInstance: logger });

  await app.register(fastifyCors, {
    origin: env.DASHBOARD_URL,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE"],
  });

  await app.register(fastifyCookie);

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: "gaulia_session", signed: false },
  });

  // Aucun détail d'erreur ne doit sortir de l'API : message générique au client, trace en console.
  app.setErrorHandler((error, request, reply) => {
    const rawStatus = (error as { statusCode?: unknown } | null)?.statusCode;
    const statusCode = typeof rawStatus === "number" && rawStatus >= 400 ? rawStatus : 500;

    if (statusCode >= 500) {
      request.log.error({ err: error }, "Erreur interne de l'API");
    } else {
      request.log.warn({ err: error }, "Requête rejetée");
    }

    return reply.status(statusCode).send({
      error: statusCode >= 500 ? "Une erreur interne est survenue." : "Requête invalide.",
    });
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.status(404).send({ error: "Ressource introuvable." }),
  );

  app.get("/health", async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(guildsRoutes);
  await app.register(settingsRoutes);
  await app.register(automodRoutes);
  await app.register(blindtestRoutes);
  await app.register(premiumRoutes);
  await app.register(creditsRoutes);
  await app.register(statsRoutes);
  await app.register(adminRoutes);
  await app.register(adventureRoutes);
  await app.register(topggRoutes);

  await app.listen({ host: "0.0.0.0", port: env.API_PORT });

  startRetentionJob();
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "Échec du démarrage de l'API");
  process.exit(1);
});
