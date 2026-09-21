import { listAdventureItems } from "@gaulia/database";
import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { localizeChoices, localizeOption, localizeSlashCommand } from "../../../i18n";
import type { Translator } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { CLASS_IDS } from "../data/classes";
import { findItem } from "../data/items";
import { EXPLORE_COOLDOWN_SECONDS } from "../data/pacing";
import { TUTORIAL_PAGE_IDS } from "../data/tutorial";
import { ZONES } from "../data/zones";
import {
  handleAchievements,
  handleImprove,
  handleJournal,
  handleLeaderboard,
  handleMap,
  handleProfile,
  handleStart,
} from "../handlers/characterHandlers";
import {
  autocompleteRecipes,
  autocompleteShop,
  handleBuy,
  handleCraft,
  handleForge,
  handleSell,
  handleShop,
} from "../handlers/economyHandlers";
import { handleDungeon, handleExplore, handleTravel } from "../handlers/explorationHandlers";
import {
  autocompleteInventory,
  handleEquip,
  handleInventory,
  handleUse,
} from "../handlers/inventoryHandlers";
import { handleQuests, handleSeal, handleStory } from "../handlers/storyHandlers";
import {
  autocompleteTradableItems,
  autocompleteTradeWishlist,
  autocompleteUpgradable,
  handleTradeAnswer,
  handleTradeList,
  handleTradeOffer,
  handleUpgrade,
} from "../handlers/tradeHandlers";
import { handleTutorial } from "../handlers/tutorialHandlers";

const KEY = "adventure.commands.adventure";
const SUB = `${KEY}.subcommands`;
const TRADE = `${KEY}.groups.trade`;
const ZONE_IDS = ZONES.map((zone) => zone.id);
const STATS = ["might", "agility", "spirit"] as const;
const TRADE_ACTIONS = ["accept", "decline", "cancel"] as const;

type SubcommandHandler = (interaction: ChatInputCommandInteraction, t: Translator) => Promise<void>;

/** Subcommand routing: one entry per subcommand, the logic lives in handlers/. */
const HANDLERS: Readonly<Record<string, SubcommandHandler>> = {
  tutorial: handleTutorial,
  start: handleStart,
  profile: handleProfile,
  explore: handleExplore,
  map: handleMap,
  travel: handleTravel,
  inventory: handleInventory,
  equip: handleEquip,
  use: handleUse,
  shop: handleShop,
  buy: handleBuy,
  sell: handleSell,
  forge: handleForge,
  craft: handleCraft,
  upgrade: handleUpgrade,
  // A group's subcommands are routed under "<group> <subcommand>".
  "trade offer": handleTradeOffer,
  "trade list": handleTradeList,
  "trade answer": handleTradeAnswer,
  quests: handleQuests,
  story: handleStory,
  seal: handleSeal,
  dungeon: handleDungeon,
  improve: handleImprove,
  leaderboard: handleLeaderboard,
  achievements: handleAchievements,
  journal: handleJournal,
};

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  // The adventure is also played in DM: it is the one place always open, whatever a server has
  // configured (see services/access/adventureAccess.ts).
  guildOnly: false,
  cooldownSeconds: EXPLORE_COOLDOWN_SECONDS,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .addSubcommand((sub) =>
      localizeSlashCommand(sub, `${SUB}.tutorial`).addStringOption((option) =>
        localizeOption(option, `${SUB}.tutorial.options.topic`).addChoices(
          ...localizeChoices(`${SUB}.tutorial.options.topic`, TUTORIAL_PAGE_IDS),
        ),
      ),
    )
    .addSubcommand((sub) =>
      localizeSlashCommand(sub, `${SUB}.start`).addStringOption((option) =>
        localizeOption(option, `${SUB}.start.options.class`)
          .setRequired(true)
          .addChoices(...localizeChoices(`${SUB}.start.options.class`, CLASS_IDS)),
      ),
    )
    .addSubcommand((sub) => localizeSlashCommand(sub, `${SUB}.profile`))
    .addSubcommand((sub) => localizeSlashCommand(sub, `${SUB}.explore`))
    .addSubcommand((sub) => localizeSlashCommand(sub, `${SUB}.map`))
    .addSubcommand((sub) =>
      localizeSlashCommand(sub, `${SUB}.travel`).addStringOption((option) =>
        localizeOption(option, `${SUB}.travel.options.region`)
          .setRequired(true)
          .addChoices(...localizeChoices(`${SUB}.travel.options.region`, ZONE_IDS)),
      ),
    )
    .addSubcommand((sub) => localizeSlashCommand(sub, `${SUB}.inventory`))
    .addSubcommand((sub) =>
      localizeSlashCommand(sub, `${SUB}.equip`).addStringOption((option) =>
        localizeOption(option, `${SUB}.equip.options.item`).setRequired(true).setAutocomplete(true),
      ),
    )
    .addSubcommand((sub) =>
      localizeSlashCommand(sub, `${SUB}.use`).addStringOption((option) =>
        localizeOption(option, `${SUB}.use.options.item`).setRequired(true).setAutocomplete(true),
      ),
    )
    .addSubcommand((sub) => localizeSlashCommand(sub, `${SUB}.shop`))
    .addSubcommand((sub) =>
      localizeSlashCommand(sub, `${SUB}.buy`)
        .addStringOption((option) =>
          localizeOption(option, `${SUB}.buy.options.item`).setRequired(true).setAutocomplete(true),
        )
        .addIntegerOption((option) =>
          localizeOption(option, `${SUB}.buy.options.quantity`).setMinValue(1).setMaxValue(99),
        ),
    )
    .addSubcommand((sub) =>
      localizeSlashCommand(sub, `${SUB}.sell`)
        .addStringOption((option) =>
          localizeOption(option, `${SUB}.sell.options.item`)
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addIntegerOption((option) =>
          localizeOption(option, `${SUB}.sell.options.quantity`).setMinValue(1).setMaxValue(999),
        ),
    )
    .addSubcommand((sub) => localizeSlashCommand(sub, `${SUB}.forge`))
    .addSubcommand((sub) =>
      localizeSlashCommand(sub, `${SUB}.craft`).addStringOption((option) =>
        localizeOption(option, `${SUB}.craft.options.recipe`)
          .setRequired(true)
          .setAutocomplete(true),
      ),
    )
    .addSubcommand((sub) =>
      localizeSlashCommand(sub, `${SUB}.upgrade`)
        .addStringOption((option) =>
          localizeOption(option, `${SUB}.upgrade.options.item`)
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addBooleanOption((option) => localizeOption(option, `${SUB}.upgrade.options.preview`)),
    )
    .addSubcommandGroup((group) =>
      localizeSlashCommand(group, TRADE)
        .addSubcommand((sub) =>
          localizeSlashCommand(sub, `${TRADE}.subcommands.offer`)
            .addUserOption((option) =>
              localizeOption(option, `${TRADE}.subcommands.offer.options.player`).setRequired(true),
            )
            .addStringOption((option) =>
              localizeOption(option, `${TRADE}.subcommands.offer.options.item`).setAutocomplete(
                true,
              ),
            )
            .addIntegerOption((option) =>
              localizeOption(option, `${TRADE}.subcommands.offer.options.quantity`)
                .setMinValue(1)
                .setMaxValue(999),
            )
            .addIntegerOption((option) =>
              localizeOption(option, `${TRADE}.subcommands.offer.options.gold`)
                .setMinValue(0)
                .setMaxValue(100_000_000),
            )
            .addStringOption((option) =>
              localizeOption(
                option,
                `${TRADE}.subcommands.offer.options.requested_item`,
              ).setAutocomplete(true),
            )
            .addIntegerOption((option) =>
              localizeOption(option, `${TRADE}.subcommands.offer.options.requested_quantity`)
                .setMinValue(1)
                .setMaxValue(999),
            )
            .addIntegerOption((option) =>
              localizeOption(option, `${TRADE}.subcommands.offer.options.requested_gold`)
                .setMinValue(0)
                .setMaxValue(100_000_000),
            ),
        )
        .addSubcommand((sub) => localizeSlashCommand(sub, `${TRADE}.subcommands.list`))
        .addSubcommand((sub) =>
          localizeSlashCommand(sub, `${TRADE}.subcommands.answer`)
            .addIntegerOption((option) =>
              localizeOption(option, `${TRADE}.subcommands.answer.options.number`)
                .setRequired(true)
                .setMinValue(1),
            )
            .addStringOption((option) =>
              localizeOption(option, `${TRADE}.subcommands.answer.options.action`)
                .setRequired(true)
                .addChoices(
                  ...localizeChoices(`${TRADE}.subcommands.answer.options.action`, TRADE_ACTIONS),
                ),
            ),
        ),
    )
    .addSubcommand((sub) => localizeSlashCommand(sub, `${SUB}.quests`))
    .addSubcommand((sub) => localizeSlashCommand(sub, `${SUB}.story`))
    .addSubcommand((sub) => localizeSlashCommand(sub, `${SUB}.seal`))
    .addSubcommand((sub) =>
      localizeSlashCommand(sub, `${SUB}.dungeon`).addBooleanOption((option) =>
        localizeOption(option, `${SUB}.dungeon.options.fight`),
      ),
    )
    .addSubcommand((sub) =>
      localizeSlashCommand(sub, `${SUB}.improve`)
        .addStringOption((option) =>
          localizeOption(option, `${SUB}.improve.options.stat`).addChoices(
            ...localizeChoices(`${SUB}.improve.options.stat`, STATS),
          ),
        )
        .addIntegerOption((option) =>
          localizeOption(option, `${SUB}.improve.options.points`).setMinValue(1).setMaxValue(300),
        ),
    )
    .addSubcommand((sub) => localizeSlashCommand(sub, `${SUB}.leaderboard`))
    .addSubcommand((sub) => localizeSlashCommand(sub, `${SUB}.achievements`))
    .addSubcommand((sub) => localizeSlashCommand(sub, `${SUB}.journal`)),

  async execute(interaction, _client, t) {
    const group = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();
    const handler = HANDLERS[group ? `${group} ${subcommand}` : subcommand];
    if (!handler) throw new GauliaError("adventure.error.unknownSubcommand");
    await handler(interaction, t);
  },

  async autocomplete(interaction, _client, t) {
    const group = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "buy") {
      await autocompleteShop(interaction, t);
      return;
    }
    if (subcommand === "craft") {
      await autocompleteRecipes(interaction, t);
      return;
    }
    // What is asked for in return is looked up in the whole catalog: you do not own it yet.
    if (group === "trade" && interaction.options.getFocused(true).name === "requested_item") {
      await autocompleteTradeWishlist(interaction, t);
      return;
    }

    const items = await listAdventureItems(interaction.user.id);

    if (subcommand === "upgrade") {
      await autocompleteUpgradable(interaction, items, t);
      return;
    }
    if (group === "trade") {
      await autocompleteTradableItems(interaction, items, t);
      return;
    }

    if (subcommand === "equip") {
      await autocompleteInventory(
        interaction,
        items,
        (itemId) => findItem(itemId)?.slot !== undefined,
        t,
      );
      return;
    }
    if (subcommand === "use") {
      await autocompleteInventory(
        interaction,
        items,
        (itemId) => findItem(itemId)?.kind === "CONSOMMABLE",
        t,
      );
      return;
    }
    if (subcommand === "sell") {
      await autocompleteInventory(
        interaction,
        items,
        (itemId) => (findItem(itemId)?.sellPrice ?? 0) > 0,
        t,
      );
    }
  },
};

export default command;
