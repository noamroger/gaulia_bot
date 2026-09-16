-- Premium : distinguer la source (abonnement Discord ou crédits) et rembourser le premium offert
-- non consommé au moment d'une souscription payante.

-- AlterEnum : le remboursement au prorata est un mouvement de crédits à part entière.
ALTER TYPE "CreditTransactionType" ADD VALUE 'PREMIUM_REFUND';

-- AlterTable : début de la fenêtre de premium offert, pour calculer la part restante.
ALTER TABLE "guilds" ADD COLUMN     "premiumGrantedAt" TIMESTAMP(3);
