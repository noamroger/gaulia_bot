-- CreateTable
CREATE TABLE "user_preferences" (
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'auto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("userId")
);

-- AlterTable
-- Existing guilds keep "fr": the bot was French only until now, so their language does not
-- change. Only guilds created from now on follow the Discord locale.
ALTER TABLE "guilds" ALTER COLUMN "language" SET DEFAULT 'auto';
