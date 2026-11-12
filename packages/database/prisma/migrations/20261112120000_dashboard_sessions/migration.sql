-- Three statements: wrapped so an interruption cannot leave the table without its indexes.
BEGIN;

-- CreateTable
CREATE TABLE "dashboard_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "manageableGuilds" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dashboard_sessions_userId_idx" ON "dashboard_sessions"("userId");

-- CreateIndex
CREATE INDEX "dashboard_sessions_expiresAt_idx" ON "dashboard_sessions"("expiresAt");


COMMIT;
