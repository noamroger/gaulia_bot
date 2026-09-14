-- AlterTable
ALTER TABLE "shard_status" ADD COLUMN     "memberCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "memoryMb" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "playerCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "command_usage_daily" (
    "date" DATE NOT NULL,
    "commandName" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "command_usage_daily_pkey" PRIMARY KEY ("date","commandName")
);

-- CreateIndex
CREATE INDEX "command_usage_daily_date_idx" ON "command_usage_daily"("date");

