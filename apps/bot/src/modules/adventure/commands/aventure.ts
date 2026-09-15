import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

import { GauliaError } from "../../../core/errors";
import type { ChatInputCommand } from "../../../structures/Command";
import {
  CLASS_CHOICES,
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
import {
  handleDungeon,
  handleExplore,
  handleTravel,
  ZONE_CHOICES,
} from "../handlers/explorationHandlers";
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
import { findItem } from "../data/items";
import { listAdventureItems } from "@gaulia/database";
import { EXPLORE_COOLDOWN_SECONDS } from "../data/pacing";

type SubcommandHandler = (interaction: ChatInputCommandInteraction) => Promise<void>;

/** Routage des sous-commandes : une entrée par sous-commande, la logique vit dans handlers/. */
const HANDLERS: Readonly<Record<string, SubcommandHandler>> = {
  commencer: handleStart,
  profil: handleProfile,
  explorer: handleExplore,
  carte: handleMap,
  voyager: handleTravel,
  inventaire: handleInventory,
  equiper: handleEquip,
  utiliser: handleUse,
  boutique: handleShop,
  acheter: handleBuy,
  vendre: handleSell,
  forge: handleForge,
  forger: handleCraft,
  renforcer: handleUpgrade,
  // Les sous-commandes d'un groupe sont routées sous « <groupe> <sous-commande> ».
  "echange proposer": handleTradeOffer,
  "echange liste": handleTradeList,
  "echange repondre": handleTradeAnswer,
  quetes: handleQuests,
  histoire: handleStory,
  sceller: handleSeal,
  donjon: handleDungeon,
  ameliorer: handleImprove,
  classement: handleLeaderboard,
  "hauts-faits": handleAchievements,
  journal: handleJournal,
};

const command: ChatInputCommand = {
  type: "chatInput",
  // L'aventure se joue aussi en message privé : c'est le seul endroit toujours ouvert, quel que
  // soit le réglage des serveurs (voir services/access/adventureAccess.ts).
  guildOnly: false,
  cooldownSeconds: EXPLORE_COOLDOWN_SECONDS,

  data: new SlashCommandBuilder()
    .setName("aventure")
    .setDescription("Ton aventure dans les Terres de Gaulia")
    .addSubcommand((sub) =>
      sub
        .setName("commencer")
        .setDescription("Crée ton aventurier et choisis sa classe")
        .addStringOption((option) =>
          option
            .setName("classe")
            .setDescription("Guerrier, mage ou rôdeur")
            .setRequired(true)
            .addChoices(...CLASS_CHOICES),
        ),
    )
    .addSubcommand((sub) => sub.setName("profil").setDescription("Fiche de ton aventurier"))
    .addSubcommand((sub) =>
      sub.setName("explorer").setDescription("Explore ta région et affronte ce qui s'y trouve"),
    )
    .addSubcommand((sub) =>
      sub.setName("carte").setDescription("Les régions ouvertes par ton histoire"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("voyager")
        .setDescription("Change de région")
        .addStringOption((option) =>
          option
            .setName("region")
            .setDescription("Région de destination")
            .setRequired(true)
            .addChoices(...ZONE_CHOICES),
        ),
    )
    .addSubcommand((sub) => sub.setName("inventaire").setDescription("Ton sac et ton équipement"))
    .addSubcommand((sub) =>
      sub
        .setName("equiper")
        .setDescription("Porte (ou retire) une pièce d'équipement")
        .addStringOption((option) =>
          option
            .setName("objet")
            .setDescription("Pièce à porter")
            .setRequired(true)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("utiliser")
        .setDescription("Utilise un consommable")
        .addStringOption((option) =>
          option
            .setName("objet")
            .setDescription("Objet à utiliser")
            .setRequired(true)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) => sub.setName("boutique").setDescription("Le comptoir du marchand"))
    .addSubcommand((sub) =>
      sub
        .setName("acheter")
        .setDescription("Achète un objet au marchand")
        .addStringOption((option) =>
          option
            .setName("objet")
            .setDescription("Objet à acheter")
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("quantite")
            .setDescription("Combien en acheter")
            .setMinValue(1)
            .setMaxValue(99),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("vendre")
        .setDescription("Revends un objet de ton sac")
        .addStringOption((option) =>
          option
            .setName("objet")
            .setDescription("Objet à vendre")
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("quantite")
            .setDescription("Combien en vendre")
            .setMinValue(1)
            .setMaxValue(999),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("forge").setDescription("Les recettes accessibles à ton niveau"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("forger")
        .setDescription("Fabrique un objet")
        .addStringOption((option) =>
          option
            .setName("recette")
            .setDescription("Recette à forger")
            .setRequired(true)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("renforcer")
        .setDescription("Améliore une pièce d'équipement avec des ressources")
        .addStringOption((option) =>
          option
            .setName("objet")
            .setDescription("Pièce à renforcer")
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addBooleanOption((option) =>
          option.setName("apercu").setDescription("Afficher le coût sans rien dépenser"),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("echange")
        .setDescription("Échanges d'objets et de pièces entre aventuriers")
        .addSubcommand((sub) =>
          sub
            .setName("proposer")
            .setDescription("Propose un échange à un autre aventurier")
            .addUserOption((option) =>
              option.setName("joueur").setDescription("Avec qui échanger").setRequired(true),
            )
            .addStringOption((option) =>
              option.setName("objet").setDescription("Objet que tu donnes").setAutocomplete(true),
            )
            .addIntegerOption((option) =>
              option
                .setName("quantite")
                .setDescription("Quantité donnée")
                .setMinValue(1)
                .setMaxValue(999),
            )
            .addIntegerOption((option) =>
              option
                .setName("or")
                .setDescription("Pièces que tu donnes")
                .setMinValue(0)
                .setMaxValue(100_000_000),
            )
            .addStringOption((option) =>
              option
                .setName("objet_demande")
                .setDescription("Objet que tu demandes en retour")
                .setAutocomplete(true),
            )
            .addIntegerOption((option) =>
              option
                .setName("quantite_demandee")
                .setDescription("Quantité demandée")
                .setMinValue(1)
                .setMaxValue(999),
            )
            .addIntegerOption((option) =>
              option
                .setName("or_demande")
                .setDescription("Pièces que tu demandes")
                .setMinValue(0)
                .setMaxValue(100_000_000),
            ),
        )
        .addSubcommand((sub) =>
          sub.setName("liste").setDescription("Tes propositions d'échange en cours"),
        )
        .addSubcommand((sub) =>
          sub
            .setName("repondre")
            .setDescription("Accepte, refuse ou annule une proposition par son numéro")
            .addIntegerOption((option) =>
              option
                .setName("numero")
                .setDescription("Numéro de la proposition")
                .setRequired(true)
                .setMinValue(1),
            )
            .addStringOption((option) =>
              option
                .setName("reponse")
                .setDescription("Que faire de cette proposition")
                .setRequired(true)
                .addChoices(
                  { name: "Accepter", value: "accepter" },
                  { name: "Refuser (proposition reçue)", value: "refuser" },
                  { name: "Annuler (proposition envoyée)", value: "annuler" },
                ),
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("quetes").setDescription("Tes quêtes du jour et de la semaine"),
    )
    .addSubcommand((sub) =>
      sub.setName("histoire").setDescription("Le chapitre en cours et ses objectifs"),
    )
    .addSubcommand((sub) =>
      sub.setName("sceller").setDescription("Scelle le chapitre terminé et ouvre la suite"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("donjon")
        .setDescription("Le gardien de l'acte, une fois par semaine")
        .addBooleanOption((option) =>
          option.setName("lancer").setDescription("Affronter le gardien maintenant"),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("ameliorer")
        .setDescription("Répartis tes points de caractéristique")
        .addStringOption((option) =>
          option
            .setName("caracteristique")
            .setDescription("Caractéristique à monter")
            .addChoices(
              { name: "Force — dégâts physiques et PV", value: "force" },
              { name: "Agilité — critique, esquive, défense", value: "agilite" },
              { name: "Esprit — dégâts magiques", value: "esprit" },
            ),
        )
        .addIntegerOption((option) =>
          option
            .setName("points")
            .setDescription("Nombre de points à placer")
            .setMinValue(1)
            .setMaxValue(300),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("classement").setDescription("Les dix plus grands aventuriers"),
    )
    .addSubcommand((sub) => sub.setName("hauts-faits").setDescription("Tes hauts faits débloqués"))
    .addSubcommand((sub) =>
      sub.setName("journal").setDescription("Les moments marquants de ton aventure"),
    ),

  help: {
    details:
      "Un jeu d'aventure au long cours : tu crées un aventurier, tu explores les Terres de Gaulia, tu combats, tu récoltes, tu forges, tu renforces ton équipement, tu échanges avec les autres joueurs et tu suis une histoire en sept actes. L'énergie limite le nombre d'explorations par jour et les fragments d'écho — gagnés avec les quêtes et le donjon hebdomadaire — font avancer le scénario : le terminer demande plus d'un an de jeu régulier. Jouable en message privé, et sur un serveur dans les salons autorisés par ses administrateurs.",
    examples: [
      "aventure commencer classe:GUERRIER",
      "aventure explorer",
      "aventure histoire",
      "aventure quetes",
      "aventure donjon lancer:true",
      "aventure renforcer objet:Épée de fer apercu:true",
      "aventure echange proposer joueur:@Léa objet:Écaille de drake quantite:5 or_demande:2000",
    ],
  },

  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();
    const handler = HANDLERS[group ? `${group} ${subcommand}` : subcommand];
    if (!handler) throw new GauliaError("Cette sous-commande n'existe pas.");
    await handler(interaction);
  },

  async autocomplete(interaction) {
    const group = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "acheter") {
      await autocompleteShop(interaction);
      return;
    }
    if (subcommand === "forger") {
      await autocompleteRecipes(interaction);
      return;
    }
    // L'objet demandé se cherche dans tout le catalogue : on ne le possède pas encore.
    if (
      subcommand === "echanger" &&
      interaction.options.getFocused(true).name === "objet_demande"
    ) {
      await autocompleteTradeWishlist(interaction);
      return;
    }

    const items = await listAdventureItems(interaction.user.id);

    if (subcommand === "renforcer") {
      await autocompleteUpgradable(interaction, items);
      return;
    }
    if (group === "echange") {
      await autocompleteTradableItems(interaction, items);
      return;
    }

    if (subcommand === "equiper") {
      await autocompleteInventory(
        interaction,
        items,
        (itemId) => findItem(itemId)?.slot !== undefined,
      );
      return;
    }
    if (subcommand === "utiliser") {
      await autocompleteInventory(
        interaction,
        items,
        (itemId) => findItem(itemId)?.kind === "CONSOMMABLE",
      );
      return;
    }
    if (subcommand === "vendre") {
      await autocompleteInventory(
        interaction,
        items,
        (itemId) => (findItem(itemId)?.sellPrice ?? 0) > 0,
      );
    }
  },
};

export default command;
