-- Premium offert en échange de crédits, indépendant des entitlements Discord (colonne "premium").
ALTER TABLE "guilds" ADD COLUMN     "premiumGrantedUntil" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('VOTE', 'PREMIUM_REDEEM', 'ADMIN_ADJUST');

-- CreateTable
CREATE TABLE "credit_accounts" (
    "userId" TEXT NOT NULL,
    "username" TEXT,
    "avatar" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "lastVoteAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_accounts_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "credit_accounts_balance_idx" ON "credit_accounts"("balance");

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "guildId" TEXT,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_transactions_userId_createdAt_idx" ON "credit_transactions"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "credit_accounts"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "topgg_votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "votedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topgg_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "topgg_votes_userId_createdAt_idx" ON "topgg_votes"("userId", "createdAt");
