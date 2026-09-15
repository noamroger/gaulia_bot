-- Aventure : renforcement des équipements et échanges entre joueurs.

-- CreateEnum
CREATE TYPE "AdventureTradeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- AlterEnum : les échanges apparaissent dans le journal des deux joueurs.
ALTER TYPE "AdventureLogType" ADD VALUE 'TRADE';

-- AlterTable
ALTER TABLE "adventure_items" ADD COLUMN     "upgradeLevel" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "adventure_characters" ADD COLUMN     "upgrades" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trades" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "adventure_trades" (
    "id" SERIAL NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "AdventureTradeStatus" NOT NULL DEFAULT 'PENDING',
    "offeredItems" JSONB NOT NULL DEFAULT '[]',
    "offeredGold" INTEGER NOT NULL DEFAULT 0,
    "requestedItems" JSONB NOT NULL DEFAULT '[]',
    "requestedGold" INTEGER NOT NULL DEFAULT 0,
    "channelId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adventure_trades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adventure_trades_targetId_status_idx" ON "adventure_trades"("targetId", "status");

-- CreateIndex
CREATE INDEX "adventure_trades_initiatorId_status_idx" ON "adventure_trades"("initiatorId", "status");

-- CreateIndex
CREATE INDEX "adventure_trades_status_expiresAt_idx" ON "adventure_trades"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "adventure_trades" ADD CONSTRAINT "adventure_trades_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "adventure_characters"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adventure_trades" ADD CONSTRAINT "adventure_trades_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "adventure_characters"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
