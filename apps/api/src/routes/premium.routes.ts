import {
  describePremium,
  getCreditAccount,
  getOrCreateGuild,
  grantGuildPremium,
  refundCredits,
  spendCredits,
} from "@gaulia/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { authenticate } from "../plugins/authenticate";
import { requireGuildAccess } from "../plugins/requireGuildAccess";
import { findPremiumOffer, PREMIUM_OFFERS } from "../premium/offers";

const redeemSchema = z.object({
  offer: z.enum(["week", "month"]),
});

export default async function premiumRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { guildId: string } }>(
    "/guilds/:guildId/premium",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request) => {
      const [guild, account] = await Promise.all([
        getOrCreateGuild(request.params.guildId),
        getCreditAccount(request.user.userId),
      ]);

      // Le détail source par source vient de `describePremium` : le dashboard affiche d'où vient
      // le premium (abonnement Discord ou crédits) et à quelle date il se renouvelle ou expire.
      const { active, source, subscription, credits } = describePremium(guild);

      return {
        premium: active,
        source,
        subscription,
        credits,
        balance: account.balance,
        offers: PREMIUM_OFFERS.map(({ id, label, cost, durationLabel }) => ({
          id,
          label,
          cost,
          durationLabel,
        })),
      };
    },
  );

  /**
   * Échange les crédits de l'utilisateur connecté contre du premium offert sur ce serveur. Le
   * débit est fait avant l'octroi : si l'octroi échoue, les crédits sont recrédités, ce qui vaut
   * mieux que d'offrir du premium sans jamais débiter.
   */
  app.post<{ Params: { guildId: string } }>(
    "/guilds/:guildId/premium/redeem",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request, reply) => {
      const parsed = redeemSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Offre inconnue." });
      }

      const offer = findPremiumOffer(parsed.data.offer);
      if (!offer) {
        return reply.status(400).send({ error: "Offre inconnue." });
      }

      const { guildId } = request.params;
      const userId = request.user.userId;

      // Les deux premiums courraient en parallèle : les crédits échangés ici seraient perdus.
      const guild = await getOrCreateGuild(guildId);
      if (describePremium(guild).subscription.active) {
        return reply.status(400).send({
          error:
            "Ce serveur a déjà un abonnement Gaulia Premium actif : tes crédits seraient dépensés pour rien. Réessaie à la fin de l'abonnement.",
        });
      }

      const spend = await spendCredits({
        userId,
        amount: offer.cost,
        guildId,
        reason: `${offer.label} (${offer.durationLabel})`,
      });

      if (!spend.spent) {
        return reply.status(400).send({
          error: `Crédits insuffisants : ${offer.cost} requis, ${spend.balance} disponible(s).`,
        });
      }

      let premiumGrantedUntil: Date;
      try {
        premiumGrantedUntil = await grantGuildPremium(guildId, offer.durationMs);
      } catch (error) {
        await refundCredits({
          userId,
          amount: offer.cost,
          guildId,
          reason: "Remboursement : échec de l'activation du premium",
        });
        throw error;
      }

      request.log.info(
        { userId, guildId, offer: offer.id, cost: offer.cost },
        "Premium offert activé contre des crédits",
      );

      return {
        premium: true,
        premiumGrantedUntil,
        balance: spend.balance,
        offerId: offer.id,
      };
    },
  );
}
