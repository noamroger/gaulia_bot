import type { AccountStrings } from "../en/account";

const account: AccountStrings = {
  contact: {
    back: "Retour à l'accueil",
    title: "Nous contacter",
    intro:
      "Une question, un bug, une demande sur tes données ? Écris ici, la réponse arrivera à l'adresse de ton compte Discord. Pour voir, télécharger ou supprimer tes données toi-même, la page {myData} le fait sans attendre de réponse.",
    myDataLink: "Mes données",
    support: "Pour une aide rapide, le {support} est souvent plus direct.",
    supportLink: "serveur de support",

    signIn: {
      anonymous: {
        title: "Connecte-toi pour nous écrire",
        body: "Le formulaire passe par ton compte Discord : ton pseudo, ton identifiant et l'adresse de ton compte accompagnent le message. Tu n'as donc rien à saisir, et la réponse part à la bonne personne.",
        action: "Se connecter avec Discord",
      },
      noEmail: {
        title: "Une autorisation en plus",
        body: "Ta session date d'avant que nous demandions l'accès à ton adresse Discord, ou ton compte n'a pas d'adresse vérifiée. Reconnecte-toi pour autoriser son partage : c'est elle qui nous permet de te répondre.",
        action: "Se reconnecter",
      },
    },

    identityHint:
      "Ton pseudo, ton identifiant Discord et cette adresse accompagnent le message. Ce n'est pas modifiable ici : tout vient de ta session.",

    subject: {
      label: "Sujet",
      question: "Question générale",
      bug: "Signaler un bug",
      premium: "Premium et crédits",
      data: "Données personnelles (RGPD)",
      other: "Autre",
    },

    guild: {
      label: "Serveur concerné (facultatif)",
      none: "Aucun en particulier",
      withBot: "Avec Gaulia",
      withoutBot: "Sans Gaulia",
    },

    message: {
      label: "Message",
      counter: "{length} / {max} caractères",
      tooShort: "Le message doit faire au moins {min} caractères.",
    },

    submit: "Envoyer le message",
    sending: "Envoi...",
    note: "Ton adresse ne sert qu'à te répondre. {privacy}",
    privacyLink: "Politique de confidentialité",
    sent: "Message envoyé. Une réponse arrivera à {email}.",
  },

  privacy: {
    meta: {
      title: "Politique de confidentialité - Gaulia",
      description: "Comment Gaulia collecte, utilise et conserve les données.",
    },

    back: "Retour au tableau de bord",
    title: "Politique de confidentialité",
    updatedOn: "20 septembre 2026",
    lastUpdated: "Dernière mise à jour : {date}",
    intro:
      "Cette page explique quelles données le bot Discord Gaulia et son tableau de bord web traitent, pourquoi, combien de temps elles sont gardées et comment en demander la suppression. Elle décrit le fonctionnement réel du service, sans formule générique.",

    summary: {
      title: "1. En bref",
      points: [
        "Nous ne vendons aucune donnée et n'affichons aucune publicité.",
        "Nous n'enregistrons jamais le contenu de vos messages.",
        "Les statistiques d'utilisation sont anonymes (aucun identifiant d'utilisateur ni de serveur) et supprimées automatiquement au bout de 90 jours.",
        "Le tableau de bord n'utilise aucun outil de mesure d'audience ni cookie publicitaire.",
        "Vous pouvez à tout moment consulter, télécharger et supprimer vos données vous-même depuis la page {myData}, en vous connectant avec Discord, et y supprimer aussi les données des serveurs que vous administrez.",
      ],
      myDataLink: "Mes données",
    },

    bot: {
      title: "2. Données traitées par le bot",

      config: {
        title: "Configuration des serveurs",
        body: "Pour chaque serveur où Gaulia est ajouté : identifiant, nom, icône et nombre de membres du serveur, langue, salons et rôles choisis dans la configuration (salons de logs, rôle DJ, salon musique, salons autorisés pour les commandes fun), et statut premium. Ces données servent au fonctionnement du bot et à l'affichage dans le tableau de bord.",
      },

      moderation: {
        title: "Modération",
        body: "Quand un modérateur utilise les commandes de sanction (bannissement, expulsion, sourdine, avertissement, purge...), Gaulia enregistre l'identifiant et le pseudo de la personne sanctionnée et du modérateur, le type de sanction, la raison indiquée, la durée éventuelle et la date. Cet historique est consultable par les modérateurs du serveur via les commandes du bot, et un résumé de chaque sanction peut être publié dans le salon de logs choisi par le serveur. Les réglages de modération du serveur (message privé au membre sanctionné, sanctions automatiques après un nombre d'avertissements) sont aussi enregistrés.",
      },

      automod: {
        title: "Automodération",
        body: "Gaulia enregistre la configuration de l'automod (règles activées, listes de domaines, d'invitations et de mots interdits, sanctions choisies, salons et rôles ignorés). Pour détecter le spam, le bot garde temporairement en mémoire vive le dernier message et l'heure des messages récents de chaque membre. Ces informations ne sont jamais écrites sur disque ni en base de données, et disparaissent au redémarrage du bot. Quand une règle est enfreinte, le message est supprimé, la sanction choisie par le serveur est appliquée (et enregistrée dans l'historique de modération), et un avis (pseudo de l'auteur, salon, type d'infraction et sanction, sans le contenu du message) peut être publié dans le salon de logs du serveur. Les règles d'AutoMod natives de Discord sont appliquées par Discord lui-même.",
      },

      music: {
        title: "Musique",
        body: "Gaulia enregistre uniquement les réglages musique du serveur (volume et répétition par défaut, mode 24/7, salon dédié et rôle DJ). Vos recherches sont transmises à notre serveur audio pour trouver le morceau, puis à SoundCloud (et à Spotify quand vous partagez un lien Spotify). La file d'attente, avec l'identifiant et le pseudo de la personne qui a demandé chaque morceau, n'existe qu'en mémoire pendant la lecture et n'est jamais enregistrée.",
      },

      games: {
        title: "Jeux et divertissement",
        body: "Les jeux du module fun (puissance 4, morpion, pendu, Wordle, blackjack) gardent l'état de chaque partie en cours (identifiants des joueurs, grille, mot à trouver, propositions) uniquement en mémoire vive. Il disparaît à la fin de la partie, après 10 minutes d'inactivité ou au redémarrage du bot, et n'est jamais enregistré. Le résultat de la commande lovecalc est calculé à partir des identifiants Discord des deux membres, sans rien conserver.",
        blindtest:
          "Pendant un blindtest, Gaulia lit les messages envoyés dans le salon de la partie par les membres présents dans le salon vocal, uniquement pour les comparer à la réponse attendue : ils ne sont ni enregistrés ni conservés. Les scores (identifiants des joueurs et points) restent en mémoire vive et disparaissent à la fin de la partie. Les extraits joués sont les aperçus de 30 secondes fournis publiquement par Spotify, rejoués par notre serveur audio (ou retrouvés sur SoundCloud à défaut) : aucune donnée vous concernant n'est transmise à Spotify.",
        playlists:
          "Les gestionnaires d'un serveur peuvent créer des listes de musiques pour le blindtest depuis le tableau de bord. Nous enregistrons le nom de chaque liste et, pour chaque titre, son nom, son artiste, sa durée et ses liens Spotify, avec la configuration du serveur. Pour importer un lien Spotify, notre serveur lit la page publique correspondante chez Spotify, sans transmettre aucune donnée vous concernant. Ces listes sont supprimées avec les autres données du serveur.",
      },

      premium: {
        title: "Abonnement premium",
        body: "Les abonnements Gaulia Premium sont vendus et gérés par Discord : nous ne voyons ni ne stockons aucune information de paiement. Nous gardons une copie des droits transmis par Discord (identifiant de l'abonnement, offre, serveur ou utilisateur concerné, dates de début et de fin) pour activer les fonctionnalités premium.",
      },

      votes: {
        title: "Votes top.gg et crédits",
        body: "Si vous votez pour Gaulia sur top.gg, top.gg nous transmet votre identifiant Discord, votre pseudo, l'adresse de votre avatar et la date du vote. Nous enregistrons l'identifiant de chaque vote (pour ne pas vous créditer deux fois pour le même vote), votre solde de crédits et l'historique de vos mouvements de crédits (votes, échanges contre du premium offert, ajustements par un administrateur du bot). Ces données servent uniquement à faire fonctionner les crédits : elles sont visibles par vous sur le tableau de bord et par les propriétaires du bot dans leur panneau d'administration. Elles sont conservées tant que votre compte de crédits existe, et supprimées sur demande. Nous ne recevons de top.gg aucune information de compte au-delà de ce qui est listé ici.",
      },

      stats: {
        title: "Statistiques",
        body: "Pour suivre la santé du service, nous comptons le nombre d'utilisations de chaque commande par jour, avec sa catégorie (modération, musique, fun...). Ces compteurs ne contiennent ni identifiant d'utilisateur, ni identifiant de serveur, ni contenu : il est impossible de savoir qui a utilisé une commande. Ils sont supprimés automatiquement après 90 jours. Nous relevons aussi des indicateurs techniques globaux (nombre de serveurs, nombre total de membres, latence, mémoire utilisée), sans aucune donnée personnelle. Leur historique, par tranche de 10 minutes, est lui aussi supprimé automatiquement après 90 jours. Le nombre total de serveurs, de membres et de commandes utilisées sur les 30 derniers jours est affiché publiquement sur la page d'accueil, sans aucun détail par serveur ni par utilisateur.",
      },
    },

    dashboard: {
      title: "3. Données traitées par le tableau de bord",
      body: "La connexion se fait avec votre compte Discord (autorisations « identify », « guilds » et « email »). Nous recevons votre identifiant, votre pseudo, votre avatar, l'adresse vérifiée de votre compte et la liste des serveurs que vous pouvez gérer. Ces informations sont placées uniquement dans un cookie de session signé, et ne sont pas enregistrées en base de données. L'adresse ne sert qu'à vous répondre si vous écrivez depuis la page {contact} : elle n'est jamais ajoutée à une liste de diffusion. Le jeton d'accès fourni par Discord sert une seule fois, pendant la connexion, puis n'est pas conservé.",
      contactLink: "Nous contacter",

      cookies: {
        name: "Cookie",
        purpose: "Rôle",
        lifetime: "Durée",
        session: "Garder votre session ouverte",
        sessionLifetime: "12 heures",
        state: "Sécuriser la connexion avec Discord",
        stateLifetime: "5 minutes",
        return: "Revenir à la page d'où vous vous êtes connecté",
        returnLifetime: "5 minutes",
        note: "Ces cookies sont strictement nécessaires au fonctionnement du tableau de bord.",
      },

      form: {
        title: "Formulaire de contact",
        body: "La page {contact} demande d'être connecté avec Discord. Le message envoyé est accompagné de votre pseudo, de votre identifiant, de votre avatar et de l'adresse vérifiée de votre compte, tous repris de votre session, donc rien n'est saisi à la main et personne ne peut écrire en se faisant passer pour vous. L'ensemble part par courrier électronique à l'administrateur du bot. Rien n'est enregistré en base de données : le message vit dans la boîte mail qui le reçoit, et votre adresse ne sert qu'à vous répondre. Pour limiter les abus, le nombre d'envois par compte est plafonné ; ces compteurs restent en mémoire et disparaissent au redémarrage.",
      },
    },

    logs: {
      title: "4. Journaux techniques",
      body: "Nos serveurs enregistrent des journaux techniques (requêtes reçues avec l'adresse IP de connexion, identifiants de serveurs et erreurs) pour assurer la sécurité et corriger les problèmes. Ils ne servent à rien d'autre et sont effacés automatiquement par rotation (50 Mo maximum par service).",
    },

    retention: {
      title: "5. Durées de conservation",
      dataColumn: "Données",
      durationColumn: "Conservation",

      stats: "Statistiques d'utilisation et historique des indicateurs techniques (anonymes)",
      statsDuration: "90 jours, puis suppression automatique",
      session: "Session du tableau de bord",
      sessionDuration: "12 heures",
      memory: "Mémoire anti-spam, file d'attente musique et parties de jeu en cours",
      memoryDuration: "Jusqu'au redémarrage du bot, jamais enregistrées",
      contact: "Messages envoyés depuis le formulaire de contact",
      contactDuration:
        "Jamais enregistrés en base : conservés dans la boîte mail de l'administrateur le temps de traiter la demande",
      logs: "Journaux techniques",
      logsDuration: "Rotation automatique (50 Mo maximum par service)",
      config: "Configuration, historique de modération, réglages",
      configDuration: "Jusqu'à une demande de suppression",
      premium: "Droits premium",
      premiumDuration: "Tant que l'abonnement existe chez Discord",
      credits: "Votes top.gg et crédits",
      creditsDuration: "Jusqu'à une demande de suppression",

      note: "Retirer Gaulia d'un serveur arrête toute nouvelle collecte pour ce serveur. Les données déjà enregistrées sont conservées pour le cas où le bot serait ajouté à nouveau, jusqu'à ce que vous en demandiez la suppression.",
    },

    sharing: {
      title: "6. Partage des données",
      intro: "Vos données ne sont partagées qu'avec les services nécessaires au fonctionnement :",
      partners: [
        "Discord, la plateforme sur laquelle fonctionne le bot ;",
        "SoundCloud et Spotify, uniquement pour les recherches musicales que vous lancez ;",
        "top.gg, si vous choisissez d'y voter pour Gaulia : c'est top.gg qui nous transmet votre vote, nous ne lui envoyons que le nombre de serveurs du bot ;",
        "l'hébergeur du serveur sur lequel tournent le bot, l'API et la base de données.",
      ],
      note: "Aucune donnée n'est vendue, louée ou utilisée à des fins publicitaires.",
    },

    security: {
      title: "7. Sécurité",
      body: "La base de données n'est accessible que depuis le réseau interne de nos serveurs. Le tableau de bord et l'API sont servis en HTTPS. L'administration du service est réservée aux propriétaires du bot.",
    },

    rights: {
      title: "8. Vos droits",
      body: "Conformément au RGPD, vous pouvez accéder à vos données, en obtenir une copie et en demander la suppression. La page {myData} le fait directement, sans passer par nous : connectez-vous avec Discord, et vous y trouverez le détail de ce qui est enregistré sur votre compte, un téléchargement au format JSON et un bouton de suppression définitive. C'est la connexion Discord qui prouve que le compte est le vôtre, donc personne d'autre ne peut consulter ni effacer vos données.",
      myDataLink: "Mes données",
      manager:
        "La même page permet aussi, si vous administrez un serveur (permission « Gérer le serveur » côté Discord), de supprimer les données de ce serveur.",

      userLabel: "Suppression d'un utilisateur",
      user: "{label} : le compte de crédits et son historique, les votes top.gg enregistrés, les droits premium en cache et le personnage d'aventure avec son inventaire et sa progression sont effacés.",
      guildLabel: "Suppression d'un serveur",
      guild:
        "{label} : toutes ses données sont effacées (configuration, historique de modération, avertissements, automod, musique, listes de blindtest, réglages de l'aventure, premium), pour tous ses membres. Si Gaulia est encore sur le serveur, une configuration vierge est recréée automatiquement, mais l'historique ne revient pas.",

      moderationNote:
        "L'historique de modération (les sanctions et avertissements reçus comme ceux donnés) relève du serveur qui les a prononcés, et non des membres concernés : il ne part donc pas avec la suppression d'un compte, sans quoi il suffirait d'être sanctionné pour effacer la trace de sa sanction. Il est effacé avec les données du serveur, ou sur demande.",
      contactUs:
        "Pour une demande que cette page ne couvre pas (le retrait d'une sanction dont vous avez fait l'objet sur un serveur que vous n'administrez pas, une rectification, ou une question sur le traitement), écrivez à {contact} en indiquant votre identifiant Discord (ou celui du serveur concerné). Nous répondons dans un délai d'un mois.",
      contactFallback: "l'équipe Gaulia",
      premiumNote:
        "Un abonnement premium encore actif chez Discord est resynchronisé automatiquement : pour l'arrêter, annulez-le depuis les paramètres Discord. Vous pouvez aussi déposer une réclamation auprès de la CNIL (cnil.fr).",
    },

    changes: {
      title: "9. Modifications",
      body: "Cette politique peut évoluer avec le service. La date de dernière mise à jour figure en haut de cette page.",
    },
  },

  myData: {
    meta: {
      title: "Mes données - Gaulia",
      description:
        "Consulte, télécharge ou supprime les données que Gaulia conserve sur ton compte.",
    },

    back: "Retour à l'accueil",
    title: "Mes données",
    intro:
      "Tout ce que Gaulia conserve sur ton compte Discord, à consulter, à télécharger ou à supprimer toi-même, sans avoir à écrire à qui que ce soit. Pour le détail de ce qui est collecté et pourquoi, la {privacy} explique chaque point.",
    privacyLink: "politique de confidentialité",

    signIn: {
      title: "Connecte-toi pour voir tes données",
      body: "Cette page affiche ce que Gaulia conserve sur ton compte Discord. Elle passe donc par une connexion Discord : c'est elle qui prouve que le compte est bien le tien, et personne d'autre ne peut consulter ni supprimer tes données.",
      action: "Se connecter avec Discord",
    },

    confirm: {
      word: "SUPPRIMER",
      label: "Recopie {word} pour confirmer",
      pending: "Suppression...",
      action: "Confirmer la suppression définitive",
    },

    account: {
      hint: "Ton pseudo, ton avatar et ton adresse viennent de Discord et ne vivent que dans le cookie de ta session, pendant 12 heures. Ils ne sont pas enregistrés en base de données.",
      download: "Télécharger mes données (JSON)",
      fileName: "gaulia-mes-donnees-{userId}.json",
      generatedAt: "Relevé du {date}",
    },

    stored: {
      title: "Ce que nous avons enregistré",
      subtitle:
        "Les identifiants des autres membres (le modérateur d'une sanction, le partenaire d'un échange) ne figurent pas ici : ce sont leurs données, pas les tiennes.",
      none: "Aucune",
    },

    columns: {
      guild: "Serveur",
      type: "Type",
      reason: "Raison",
      duration: "Durée",
      date: "Date",
      status: "État",
      movement: "Mouvement",
      amount: "Montant",
      balanceAfter: "Solde après",
      start: "Début",
      end: "Fin",
    },

    sanctions: {
      title: "Sanctions reçues",
      empty: "Aucune sanction enregistrée à ton nom.",
      note: "Ces lignes appartiennent à l'historique des serveurs qui les ont prononcées : elles ne partent pas avec la suppression de ton compte. Pour les faire retirer, demande-le aux responsables du serveur, ou écris-nous depuis la page {contact}.",
    },

    warns: {
      title: "Avertissements reçus",
      empty: "Aucun avertissement enregistré à ton nom.",
      note: "Comme les sanctions, ils appartiennent au serveur qui les a donnés et ne partent pas avec la suppression de ton compte.",
      active: "Actif",
      removed: "Retiré",
    },

    moderator: {
      title: "Sanctions données en tant que modérateur",
      empty: "Tu n'as sanctionné personne avec Gaulia.",
      cases: "Sanctions prononcées",
      warns: "Avertissements donnés",
      note: "Ces lignes appartiennent elles aussi à l'historique des serveurs concernés.",
    },

    credits: {
      title: "Crédits et votes top.gg",
      empty: "Aucun compte de crédits : tu n'as jamais voté pour Gaulia.",
      balance: "Solde actuel",
      totalEarned: "Total gagné depuis le début",
      voteCount: "Votes comptabilisés",
      lastVote: "Dernier vote",
      votesNote: {
        one: "{value} vote gardé en mémoire, uniquement pour ne pas te créditer deux fois le même. Le détail est dans le fichier JSON.",
        other:
          "{value} votes gardés en mémoire, uniquement pour ne pas te créditer deux fois le même. Le détail est dans le fichier JSON.",
      },
    },

    premium: {
      title: "Droits premium",
      empty: "Aucun abonnement premium rattaché à ton compte.",
      active: "Actif",
      ended: "Terminé",
      note: "Ce sont les droits transmis par Discord. Aucune information de paiement ne nous parvient : l'abonnement lui-même se gère depuis les paramètres Discord.",
    },

    adventure: {
      title: "Aventure",
      empty: "Aucun personnage d'aventure créé.",
      characterClass: "Classe",
      level: "Niveau",
      totalXp: "Expérience totale",
      goldAndEchoes: "Or et échos",
      items: "Objets en inventaire",
      achievements: "Hauts faits débloqués",
      record: "Explorations · victoires · défaites",
      lastPlayed: "Dernière partie",
      note: "L'inventaire, les quêtes, le journal et l'historique des échanges figurent en entier dans le fichier JSON.",
    },

    guilds: {
      title: "Serveurs que tu peux gérer",
      empty: "Aucun serveur administrable avec ce compte.",
      note: "Cette liste vient de Discord à chaque connexion et n'est pas enregistrée. Elle sert à savoir quels serveurs afficher dans le tableau de bord.",
    },

    deleteAccount: {
      title: "Supprimer mes données",
      subtitle: "La suppression est définitive et immédiate. Elle efface ce qui suit ton compte :",
      items: [
        "ton compte de crédits, son historique et tes votes top.gg enregistrés ;",
        "ton personnage d'aventure, son inventaire et sa progression ;",
        "les droits premium gardés en cache pour ton compte.",
      ],
      note: "L'historique de modération n'en fait pas partie : une sanction ou un avertissement appartient au serveur qui l'a prononcé, pas au membre concerné. Il part avec les données du serveur, ci-dessous si tu l'administres, sinon sur demande aux responsables du serveur ou à nous depuis la page {contact}. Un abonnement premium encore actif chez Discord sera resynchronisé automatiquement : pour l'arrêter, annule-le depuis les paramètres Discord.",
      action: "Supprimer mes données",
    },

    deleteGuild: {
      title: "Supprimer les données d'un serveur",
      subtitle:
        "Les serveurs que tu administres et pour lesquels Gaulia a enregistré quelque chose. Supprimer, c'est effacer les données du serveur entier, pour tous ses membres, historique de modération compris.",
      empty: "Aucun des serveurs que tu administres n'a de données enregistrées chez Gaulia.",
      action: "Supprimer les données de ce serveur",
      deleted: "Les données de ce serveur ont été supprimées.",
      deletedBotPresent:
        "Gaulia y étant encore, une configuration vierge sera recréée automatiquement.",
      note: "Tout part d'un coup, pour tous les membres du serveur : configuration, historique de modération, avertissements, automod, musique, listes de blindtest et réglages de l'aventure.",
      noteBotPresent:
        "Gaulia étant encore sur le serveur, une configuration vierge sera recréée à la prochaine synchronisation, mais l'historique, lui, ne revient pas.",
      present: "Gaulia y est",
      left: "Gaulia en est parti",
      fallback: "Serveur {id}",

      cases: "Sanctions dans l'historique",
      warns: "Avertissements",
      playlists: "Listes de blindtest",
      premium: "Droits premium en cache",
      config: { label: "Configuration du serveur", stored: "Enregistrée", none: "Aucune" },
      automod: { label: "Règles d'automod", stored: "Enregistrées", none: "Aucune" },
      music: { label: "Réglages musique", stored: "Enregistrés", none: "Aucun" },
      adventure: { label: "Réglages de l'aventure", stored: "Enregistrés", none: "Aucun" },
    },

    done: {
      notice: "Tes données ont été supprimées.",
      body: "Ta session a été fermée, puisqu'elle contenait elle aussi ton pseudo et ton adresse. L'historique de modération des serveurs et la configuration de ceux que tu administres n'ont pas été touchés : ils appartiennent aux serveurs. Si tu utilises encore Gaulia, de nouvelles données pourront être créées, et cette page te permettra de les supprimer à nouveau.",
      home: "Retour à l'accueil",
    },

    duration: {
      minutes: "{value} min",
      hours: "{value} h",
      days: "{value} j",
    },

    caseTypes: {
      BAN: "Bannissement",
      UNBAN: "Débannissement",
      KICK: "Expulsion",
      TIMEOUT: "Sourdine",
      UNTIMEOUT: "Fin de sourdine",
      WARN: "Avertissement",
      UNWARN: "Avertissement retiré",
      PURGE: "Purge de messages",
    },

    creditTypes: {
      VOTE: "Vote top.gg",
      PREMIUM_REDEEM: "Échange contre du premium",
      ADMIN_ADJUST: "Ajustement par un administrateur",
      PREMIUM_REFUND: "Remboursement de premium offert",
    },

    classes: {
      GUERRIER: "Guerrier",
      MAGE: "Mage",
      RODEUR: "Rôdeur",
    },
  },
};

export default account;
