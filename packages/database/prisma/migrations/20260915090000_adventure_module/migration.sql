-- Module aventure : réglages d'accès par serveur et progression globale des joueurs.

-- CreateEnum
CREATE TYPE "AdventureChannelMode" AS ENUM ('ALLOWLIST', 'BLOCKLIST');

-- CreateEnum
CREATE TYPE "AdventureClass" AS ENUM ('GUERRIER', 'MAGE', 'RODEUR');

-- CreateEnum
CREATE TYPE "AdventureQuestKind" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "AdventureLogType" AS ENUM ('STORY', 'DUNGEON', 'LEVEL_UP', 'ADMIN');

-- CreateTable
CREATE TABLE "adventure_settings" (
    "guildId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "channelMode" "AdventureChannelMode" NOT NULL DEFAULT 'ALLOWLIST',
    "channelIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adventure_settings_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "adventure_characters" (
    "userId" TEXT NOT NULL,
    "username" TEXT,
    "characterClass" "AdventureClass" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "statPoints" INTEGER NOT NULL DEFAULT 0,
    "might" INTEGER NOT NULL DEFAULT 0,
    "agility" INTEGER NOT NULL DEFAULT 0,
    "spirit" INTEGER NOT NULL DEFAULT 0,
    "hp" INTEGER NOT NULL,
    "energy" INTEGER NOT NULL,
    "regenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "echoes" INTEGER NOT NULL DEFAULT 0,
    "zoneId" TEXT NOT NULL DEFAULT 'clairiere',
    "actIndex" INTEGER NOT NULL DEFAULT 0,
    "chapterIndex" INTEGER NOT NULL DEFAULT 0,
    "chapterProgress" JSONB NOT NULL DEFAULT '{}',
    "storyEndedAt" TIMESTAMP(3),
    "explorations" INTEGER NOT NULL DEFAULT 0,
    "victories" INTEGER NOT NULL DEFAULT 0,
    "defeats" INTEGER NOT NULL DEFAULT 0,
    "dungeonClears" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "lastStreakDay" TIMESTAMP(3),
    "lastDungeonAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adventure_characters_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "adventure_items" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adventure_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adventure_quests" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "AdventureQuestKind" NOT NULL,
    "questId" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "claimedAt" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adventure_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adventure_achievements" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adventure_achievements_pkey" PRIMARY KEY ("userId","achievementId")
);

-- CreateTable
CREATE TABLE "adventure_logs" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AdventureLogType" NOT NULL,
    "message" TEXT NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adventure_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adventure_characters_level_totalXp_idx" ON "adventure_characters"("level", "totalXp");

-- CreateIndex
CREATE INDEX "adventure_items_userId_idx" ON "adventure_items"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "adventure_items_userId_itemId_key" ON "adventure_items"("userId", "itemId");

-- CreateIndex
CREATE INDEX "adventure_quests_userId_kind_periodStart_idx" ON "adventure_quests"("userId", "kind", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "adventure_quests_userId_kind_questId_periodStart_key" ON "adventure_quests"("userId", "kind", "questId", "periodStart");

-- CreateIndex
CREATE INDEX "adventure_logs_userId_createdAt_idx" ON "adventure_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "adventure_settings" ADD CONSTRAINT "adventure_settings_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adventure_items" ADD CONSTRAINT "adventure_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "adventure_characters"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adventure_quests" ADD CONSTRAINT "adventure_quests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "adventure_characters"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adventure_achievements" ADD CONSTRAINT "adventure_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "adventure_characters"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adventure_logs" ADD CONSTRAINT "adventure_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "adventure_characters"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
