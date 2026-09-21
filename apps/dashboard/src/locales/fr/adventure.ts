import type { AdventureStrings } from "../en/adventure";

const adventure: AdventureStrings = {
  loadError: "Impossible de charger les réglages de l'aventure.",

  where: {
    title: "Où l'aventure se joue",
    description:
      "Les membres peuvent toujours jouer en message privé avec Gaulia : ce réglage ne concerne que les salons de ce serveur. Il s'applique à tout le monde, administrateurs compris.",
    module: {
      label: "Module aventure",
      hint: "Désactivé, /aventure ne répond plus dans aucun salon du serveur.",
    },
    mode: {
      label: "Mode des salons",
      hint: "Par défaut, la liste blanche est vide : l'aventure est donc interdite partout tant qu'aucun salon n'a été autorisé.",
      aria: "Mode des salons d'aventure",
    },
    allowedLabel: "Salons autorisés",
    blockedLabel: "Salons interdits",
    allowedHint: "Seuls ces salons (et leurs fils) acceptent les commandes d'aventure.",
    blockedHint:
      "Ces salons (et leurs fils) refusent les commandes d'aventure ; tous les autres les acceptent.",
    add: "Ajouter un salon...",
    emptyAllowlist: "Aucun salon - aventure interdite partout",
    emptyBlocklist: "Aucun salon - aventure autorisée partout",
    aria: "Ajouter un salon d'aventure",
    result: "Résultat",
  },

  channelMode: {
    ALLOWLIST: "Liste blanche - jouable uniquement dans les salons choisis",
    BLOCKLIST: "Liste noire - jouable partout, sauf dans les salons choisis",
  },

  summary: {
    disabled: "Le module est désactivé : l'aventure n'est jouable dans aucun salon de ce serveur.",
    allowlistEmpty:
      "Aucun salon autorisé : l'aventure n'est jouable dans aucun salon de ce serveur.",
    allowlist: {
      one: "L'aventure est jouable dans {count} salon et ses fils, nulle part ailleurs.",
      other: "L'aventure est jouable dans {count} salons et leurs fils, nulle part ailleurs.",
    },
    blocklistEmpty: "L'aventure est jouable dans tous les salons du serveur.",
    blocklist: {
      one: "L'aventure est jouable partout, sauf dans {count} salon et ses fils.",
      other: "L'aventure est jouable partout, sauf dans {count} salons et leurs fils.",
    },
  },

  about: {
    title: "À propos du module",
    description:
      "L'aventure est un jeu de rôle au long cours : chaque membre a un aventurier unique, partagé entre tous les serveurs et les messages privés.",
    progression: {
      label: "Progression",
      hint: "L'énergie limite le nombre d'explorations par jour et les fragments d'écho (gagnés avec les quêtes et le donjon hebdomadaire) font avancer le scénario. Terminer l'histoire demande plus d'un an de jeu régulier.",
      value: "7 actes · 35 chapitres",
    },
    commands: {
      label: "Commandes",
      hint: "Tout passe par /aventure : tuto, commencer, explorer, histoire, quetes, inventaire, boutique, forge, renforcer, echange, donjon, classement... Les nouveaux venus peuvent lancer /aventure tuto sans avoir de personnage.",
      value: "Une seule commande",
    },
    trades: {
      label: "Échanges entre joueurs",
      hint: "Les aventuriers peuvent s'échanger objets et pièces à partir du niveau 5. Les reliques du scénario ne s'échangent pas, et le renforcement d'un équipement reste attaché à celui qui l'a payé. Les propositions suivent les mêmes règles de salons que le reste du module.",
      value: "Objets et pièces",
    },
  },

  admin: {
    itemKind: {
      EQUIPEMENT: "Équipement",
      CONSOMMABLE: "Consommables",
      MATERIAU: "Matériaux",
      TRESOR: "Trésors",
      RELIQUE: "Reliques",
    },

    class: {
      GUERRIER: "🛡️ Guerrier",
      MAGE: "🔮 Mage",
      RODEUR: "🏹 Rôdeur",
    },

    intervention: {
      title: "Intervenir dans la partie",
      description:
        "Laisse un champ vide pour ne pas y toucher. Les valeurs sont des variations (un nombre négatif retire), sauf le niveau, qui est fixé directement. Chaque intervention est inscrite dans le journal du joueur.",
      xp: { label: "Expérience", hint: "Ajoutée comme en jeu, les niveaux montent." },
      gold: { label: "Pièces", hint: "Négatif pour retirer." },
      echoes: { label: "Fragments d'écho", hint: "La monnaie du scénario." },
      energy: { label: "Énergie", hint: "Plafond : {max}." },
      statPoints: { label: "Points de caractéristique", hint: "À répartir par le joueur." },
      level: { label: "Niveau", hint: "Valeur fixée (1 à {max})." },
      item: { label: "Objet", none: "Aucun objet", notTradable: " (non échangeable)" },
      quantity: { label: "Quantité", hint: "Négatif pour retirer du sac." },
      reason: { label: "Raison", placeholder: "Compensation d'un bug, événement..." },
      confirm:
        "Confirme l'intervention : elle sera appliquée immédiatement et visible dans le journal du joueur.",
      apply: "Appliquer",
      applying: "Application...",
    },

    sheet: {
      level: "Niveau",
      totalXp: "{value} XP au total",
      story: "Scénario",
      storyDone: "Histoire terminée",
      actFallback: "Acte {number}",
      chapterFallback: "chapitre {number}",
      purse: "Bourse",
      echoes: {
        one: "{value} fragment d'écho",
        other: "{value} fragments d'écho",
      },
      energy: "Énergie",
      hp: "{value} PV",

      stats: {
        title: "Caractéristiques",
        class: "Classe",
        attributes: "Force / Agilité / Esprit",
        statPoints: "Points à répartir",
        explorations: "Explorations",
        record: "Victoires / Défaites",
        dungeons: "Donjons",
        streak: "Série",
        streakValue: "{count} j (record {best})",
        upgrades: "Renforcements",
        trades: "Échanges conclus",
        achievements: "Hauts faits",
      },

      inventory: {
        title: "Inventaire ({count})",
        empty: "Sac vide.",
        columnItem: "Objet",
        columnQuantity: "Quantité",
        columnUpgrade: "Renfort",
        columnState: "État",
        equipped: "Porté",
      },

      quests: {
        title: "Quêtes en cours",
        empty: "Aucun lot de quêtes enregistré.",
        DAILY: "Quotidienne",
        WEEKLY: "Hebdomadaire",
      },

      trades: {
        title: "Échanges en attente ({count})",
        empty: "Aucune proposition ouverte.",
        versus: "contre",
        nothing: "rien",
        gold: "{value} pièces",
      },

      logs: {
        title: "Journal",
        empty: "Rien à signaler.",
      },
    },
  },
};

export default adventure;
