-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ModerationCaseType" AS ENUM ('BAN', 'UNBAN', 'KICK', 'TIMEOUT', 'UNTIMEOUT', 'WARN', 'UNWARN', 'PURGE');

-- CreateEnum
CREATE TYPE "LoopMode" AS ENUM ('NONE', 'TRACK', 'QUEUE');

-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "premiumExpiresAt" TIMESTAMP(3),
    "botPresent" BOOLEAN NOT NULL DEFAULT true,
    "modLogChannelId" TEXT,
    "automodLogChannelId" TEXT,
    "djRoleId" TEXT,
    "musicChannelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_cases" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "caseNumber" INTEGER NOT NULL,
    "type" "ModerationCaseType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetTag" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "moderatorTag" TEXT NOT NULL,
    "reason" TEXT,
    "durationSecs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warns" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "reason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automod_configs" (
    "guildId" TEXT NOT NULL,
    "antiInvite" BOOLEAN NOT NULL DEFAULT false,
    "antiInviteAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "antiFlood" BOOLEAN NOT NULL DEFAULT false,
    "antiFloodMessages" INTEGER NOT NULL DEFAULT 5,
    "antiFloodSeconds" INTEGER NOT NULL DEFAULT 5,
    "antiDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "antiDuplicateCount" INTEGER NOT NULL DEFAULT 3,
    "ignoredChannelIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ignoredRoleIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automod_configs_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "music_settings" (
    "guildId" TEXT NOT NULL,
    "volume" INTEGER NOT NULL DEFAULT 100,
    "stay247" BOOLEAN NOT NULL DEFAULT false,
    "defaultLoop" "LoopMode" NOT NULL DEFAULT 'NONE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "music_settings_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "premium_entitlements" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "guildId" TEXT,
    "userId" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premium_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shard_status" (
    "shardId" INTEGER NOT NULL,
    "guildCount" INTEGER NOT NULL,
    "ping" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shard_status_pkey" PRIMARY KEY ("shardId")
);

-- CreateIndex
CREATE INDEX "moderation_cases_guildId_targetId_idx" ON "moderation_cases"("guildId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_cases_guildId_caseNumber_key" ON "moderation_cases"("guildId", "caseNumber");

-- CreateIndex
CREATE INDEX "warns_guildId_userId_idx" ON "warns"("guildId", "userId");

-- CreateIndex
CREATE INDEX "premium_entitlements_guildId_idx" ON "premium_entitlements"("guildId");

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warns" ADD CONSTRAINT "warns_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automod_configs" ADD CONSTRAINT "automod_configs_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_settings" ADD CONSTRAINT "music_settings_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

