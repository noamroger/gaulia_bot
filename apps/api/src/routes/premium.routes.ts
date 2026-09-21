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

      // `describePremium` splits it source by source, so the dashboard can show where premium comes
      // from (Discord subscription or credits) and when it renews or expires.
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
   * Trades the signed-in user credits for gifted premium on this server. The debit happens before
   * the grant: if the grant fails the credits are given back, which beats handing out premium
   * without ever charging for it.
   */
  app.post<{ Params: { guildId: string } }>(
    "/guilds/:guildId/premium/redeem",
    { preHandler: [authenticate, requireGuildAccess] },
    async (request, reply) => {
      const parsed = redeemSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: request.t("errors.premium.unknownOffer") });
      }

      const offer = findPremiumOffer(parsed.data.offer);
      if (!offer) {
        return reply.status(400).send({ error: request.t("errors.premium.unknownOffer") });
      }

      const { guildId } = request.params;
      const userId = request.user.userId;

      // Both premiums would run side by side and the credits spent here would be lost.
      const guild = await getOrCreateGuild(guildId);
      if (describePremium(guild).subscription.active) {
        return reply.status(400).send({ error: request.t("errors.premium.subscriptionActive") });
      }

      const spend = await spendCredits({
        userId,
        amount: offer.cost,
        guildId,
        reason: `${offer.label} (${offer.durationLabel})`,
      });

      if (!spend.spent) {
        return reply.status(400).send({
          error: request.t("errors.premium.notEnoughCredits", {
            cost: offer.cost,
            balance: spend.balance,
          }),
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
          reason: "Refund: premium activation failed",
        });
        throw error;
      }

      request.log.info(
        { userId, guildId, offer: offer.id, cost: offer.cost },
        "Gifted premium activated with credits",
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
