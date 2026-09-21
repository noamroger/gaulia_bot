import type { TranslationModule } from "../../i18n/catalog";

const premium = {
  commands: {
    premium: {
      name: "premium",
      description: "Manage this server's Gaulia Premium subscription",
      subcommands: {
        status: {
          name: "status",
          description: "Show this server's premium status",
        },
        upgrade: {
          name: "upgrade",
          description: "Show how to move this server to premium",
        },
      },
      help: {
        details:
          "Gaulia Premium unlocks 24/7 playback, audio filters, a longer queue and the advanced automod rules. `status` says whether this server benefits from it, `upgrade` shows the subscription options, including the free week or month you can trade credits for.",
        examples: ["premium status", "premium upgrade"],
      },
    },
  },

  status: {
    activeTitle: "Gaulia Premium active",
    activeDescription:
      "This server gets 24/7 playback, audio filters, a longer queue and the advanced automod rules.",
    grantedUntil: "Premium granted with credits until {date} ({relative}).",

    inactiveTitle: "Premium status",
    inactiveDescription: "This server does not have Gaulia Premium.",
    upgradeHint: "Use `/premium upgrade` to see the subscription options.",
    skuMissing: "The premium SKU is not configured on the bot yet.",

    creditsHint:
      "**Free:** [vote for Gaulia]({voteUrl}) to earn 10 credits per vote{dashboardHint}: 150 credits for a week of premium, 500 for a month.",
    creditsDashboardLink:
      ", then trade them in your server's premium tab on [the dashboard]({dashboardUrl}/dashboard)",
    creditsDashboardPlain: ", then trade them in your server's premium tab on the dashboard",
  },

  upgrade: {
    alreadyTitle: "Already premium",
    alreadyDescription: "This server already enjoys Gaulia Premium, thank you for your support!",
  },
} satisfies TranslationModule;

export type PremiumStrings = typeof premium;

export default premium;
