-- AlterTable
ALTER TABLE "guilds" ADD COLUMN     "icon" TEXT,
ADD COLUMN     "memberCount" INTEGER NOT NULL DEFAULT 0;

