import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import Fastify, { type RawServerDefault } from "fastify";

import "./auth/session";
import { env } from "./config/env";
import { registerI18n } from "./i18n";
import { startRetentionJob } from "./jobs/retentionJob";
import { logger } from "./logger";
import adminRoutes from "./routes/admin.routes";
import adventureRoutes from "./routes/adventure.routes";
import automodRoutes from "./routes/automod.routes";
import authRoutes from "./routes/auth.routes";
import blindtestRoutes from "./routes/blindtest.routes";
import contactRoutes from "./routes/contact.routes";
import creditsRoutes from "./routes/credits.routes";
import guildsRoutes from "./routes/guilds.routes";
import personalDataRoutes from "./routes/personalData.routes";
import premiumRoutes from "./routes/premium.routes";
import settingsRoutes from "./routes/settings.routes";
import statsRoutes from "./routes/stats.routes";
import topggRoutes from "./routes/topgg.routes";

async function main(): Promise<void> {
  // Explicit server type so the instance keeps Fastify default generics: plugins such as
  // `registerI18n` take a plain FastifyInstance.
  const app = Fastify<RawServerDefault>({ loggerInstance: logger });

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

  // Must run before the routes so `request.t` exists everywhere.
  registerI18n(app);

  // No error detail leaves the API: generic message for the client, stack trace in the logs.
  app.setErrorHandler((error, request, reply) => {
    const rawStatus = (error as { statusCode?: unknown } | null)?.statusCode;
    const statusCode = typeof rawStatus === "number" && rawStatus >= 400 ? rawStatus : 500;

    if (statusCode >= 500) {
      request.log.error({ err: error }, "Internal API error");
    } else {
      request.log.warn({ err: error }, "Request rejected");
    }

    return reply.status(statusCode).send({
      error: request.t(statusCode >= 500 ? "errors.common.internal" : "errors.common.badRequest"),
    });
  });

  app.setNotFoundHandler((request, reply) =>
    reply.status(404).send({ error: request.t("errors.common.notFound") }),
  );

  app.get("/health", async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(guildsRoutes);
  await app.register(settingsRoutes);
  await app.register(automodRoutes);
  await app.register(blindtestRoutes);
  await app.register(premiumRoutes);
  await app.register(creditsRoutes);
  await app.register(contactRoutes);
  await app.register(personalDataRoutes);
  await app.register(statsRoutes);
  await app.register(adminRoutes);
  await app.register(adventureRoutes);
  await app.register(topggRoutes);

  await app.listen({ host: "0.0.0.0", port: env.API_PORT });

  startRetentionJob();
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "API failed to start");
  process.exit(1);
});
