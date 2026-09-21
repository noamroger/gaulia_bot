import { CREDITS_PER_VOTE, getCreditAccount, listCreditTransactions } from "@gaulia/database";
import type { FastifyInstance } from "fastify";

import { authenticate } from "../plugins/authenticate";
import { PREMIUM_OFFERS } from "../premium/offers";

const HISTORY_LIMIT = 15;

/** Credits of the signed-in user, earned by voting on top.gg. */
export default async function creditsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me/credits", { preHandler: authenticate }, async (request) => {
    const userId = request.user.userId;
    const [account, transactions] = await Promise.all([
      getCreditAccount(userId),
      listCreditTransactions(userId, HISTORY_LIMIT),
    ]);

    return {
      balance: account.balance,
      totalEarned: account.totalEarned,
      voteCount: account.voteCount,
      lastVoteAt: account.lastVoteAt,
      creditsPerVote: CREDITS_PER_VOTE,
      offers: PREMIUM_OFFERS.map(({ id, label, cost, durationLabel }) => ({
        id,
        label,
        cost,
        durationLabel,
      })),
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
        guildId: transaction.guildId,
        reason: transaction.reason,
        createdAt: transaction.createdAt,
      })),
    };
  });
}
