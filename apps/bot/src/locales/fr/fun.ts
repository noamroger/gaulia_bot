import type { FunStrings } from "../en/fun";

const fun: FunStrings = {
  commands: {
    blackjack: {
      name: "blackjack",
      description: "Affronte le croupier au blackjack",
      help: {
        details:
          "Approche-toi le plus possible de 21 sans le dépasser. `Tirer` ajoute une carte à ta main, `Rester` laisse jouer le croupier, qui tire jusqu'à atteindre 17. Les figures valent 10 et l'as 1 ou 11. Aucune mise : on joue pour le plaisir.",
        examples: ["blackjack"],
      },
    },

    minesweeper: {
      name: "demineur",
      description: "Génère une grille de démineur à découvrir",
      help: {
        details:
          "Affiche une grille dont les cases sont cachées : clique dessus pour les découvrir sans tomber sur une mine. Chaque chiffre indique le nombre de mines dans les cases voisines, et une case sans danger est déjà révélée pour commencer. Facile : 6×6 et 5 mines, normale : 8×8 et 10 mines, difficile : 9×9 et 16 mines.",
        examples: ["demineur", "demineur difficulte:Difficile"],
      },
      options: {
        difficulty: {
          name: "difficulte",
          description: "Taille de la grille et nombre de mines (normale par défaut)",
          choices: {
            easy: "Facile",
            normal: "Normale",
            hard: "Difficile",
          },
        },
      },
    },

    lovecalc: {
      name: "lovecalc",
      description: "Calcule la compatibilité amoureuse entre deux membres",
      help: {
        details:
          "Calcule un score de compatibilité de 0 à 100 % à partir des identifiants Discord des deux membres. Le résultat est toujours le même pour un même duo, quel que soit l'ordre, et rien n'est enregistré. Sans second membre, le calcul se fait avec toi.",
        examples: ["lovecalc membre:@Pseudo", "lovecalc membre:@Pseudo membre2:@Autre"],
      },
      options: {
        member: {
          name: "membre",
          description: "Premier membre",
        },
        member2: {
          name: "membre2",
          description: "Second membre (toi par défaut)",
        },
      },
    },

    tictactoe: {
      name: "morpion",
      description: "Lance une partie de morpion contre un membre ou contre Gaulia",
      help: {
        details:
          "Aligne 3 symboles sur la grille avant ton adversaire en cliquant sur les cases. Avec un adversaire, il reçoit un défi à accepter dans les 2 minutes et le premier joueur est tiré au sort. Sans adversaire, tu affrontes Gaulia : en difficile, elle ne perd jamais. Une partie sans coup joué pendant 10 minutes expire.",
        examples: ["morpion adversaire:@Pseudo", "morpion difficulte:Facile"],
      },
      options: {
        opponent: {
          name: "adversaire",
          description: "Membre à défier ; sans membre, tu joues contre Gaulia",
        },
        difficulty: {
          name: "difficulte",
          description: "Difficulté quand tu joues contre Gaulia (normale par défaut)",
          choices: {
            easy: "Facile",
            normal: "Normale",
            hard: "Difficile",
          },
        },
      },
    },

    hangman: {
      name: "pendu",
      description: "Lance une partie de pendu et devine le mot caché",
      help: {
        details:
          "Devine le mot lettre par lettre avec les menus, ou propose directement le mot entier. Au bout de 6 erreurs, la partie est perdue ; un mot faux compte comme une erreur. Les accents sont ignorés. Avec `ouvert`, tous les membres du salon jouent ensemble.",
        examples: ["pendu", "pendu ouvert:True"],
      },
      options: {
        open: {
          name: "ouvert",
          description: "Tous les membres du salon peuvent proposer des lettres (non par défaut)",
        },
      },
    },

    connect4: {
      name: "puissance4",
      description: "Lance une partie de puissance 4 contre un membre ou contre Gaulia",
      help: {
        details:
          "Aligne 4 jetons horizontalement, verticalement ou en diagonale avant ton adversaire. Avec un adversaire, il reçoit un défi à accepter dans les 2 minutes et le premier joueur est tiré au sort. Sans adversaire, tu affrontes Gaulia avec la difficulté de ton choix. Une partie sans coup joué pendant 10 minutes expire.",
        examples: ["puissance4 adversaire:@Pseudo", "puissance4 difficulte:Difficile"],
      },
      options: {
        opponent: {
          name: "adversaire",
          description: "Membre à défier ; sans membre, tu joues contre Gaulia",
        },
        difficulty: {
          name: "difficulte",
          description: "Difficulté quand tu joues contre Gaulia (normale par défaut)",
          choices: {
            easy: "Facile",
            normal: "Normale",
            hard: "Difficile",
          },
        },
      },
    },

    wordle: {
      name: "wordle",
      description: "Trouve un mot de 5 lettres en 6 essais",
      help: {
        details:
          "Propose des mots de 5 lettres pour trouver le mot mystère. Après chaque essai, un carré vert indique une lettre bien placée, un carré jaune une lettre présente ailleurs et un carré noir une lettre absente. Les accents sont ignorés et le mot proposé doit exister dans le dictionnaire de Gaulia.",
        examples: ["wordle"],
      },
    },
  },

  difficulty: {
    easy: "facile",
    normal: "normale",
    hard: "difficile",
  },

  bot: "Gaulia",

  error: {
    staleButton: "Ce bouton n'est plus valide.",
    gameOver: "Cette partie est terminée ou a expiré.",
    channelRestricted: "Les commandes fun sont réservées aux salons suivants : {channels}",
  },

  game: {
    expired: "Partie expirée après 10 minutes d'inactivité.",
    forfeitButton: "Abandonner",
    difficultyNote: "difficulté {difficulty}",
  },

  match: {
    players: "{firstMark} {first} contre {secondMark} {second}",
    turn: "Au tour de {player} {mark}",
    win: "{player} {mark} remporte la partie !",
    forfeited: "{loser} abandonne, {winner} remporte la partie.",
    notPlaying: "Tu ne participes pas à cette partie.",
    notYourTurn: "Ce n'est pas ton tour.",
  },

  blackjack: {
    title: "Blackjack",
    owner: "Partie de {player}",
    dealerHand: "**Croupier** ({score}) : {cards}",
    playerHand: "**Ta main** ({score}) : {cards}",
    prompt: "Tirer une carte ou rester ?",
    hitButton: "Tirer",
    standButton: "Rester",
    replayButton: "Rejouer",
    notYours: "Cette partie ne t'appartient pas. Lance la tienne avec `/blackjack`.",
    startYourOwn: "Lance ta propre partie avec `/blackjack`.",
    faces: {
      ace: "A",
      jack: "V",
      queen: "D",
      king: "R",
    },
    outcome: {
      blackjack: "Blackjack ! Tu gagnes.",
      win: "Tu gagnes !",
      dealerBust: "Le croupier dépasse 21, tu gagnes !",
      lose: "Le croupier gagne.",
      bust: "Tu dépasses 21, perdu.",
      push: "Égalité.",
    },
  },

  minesweeper: {
    title: "Démineur",
    summary: "Grille {size}×{size} · {mines} mines · difficulté {difficulty}",
    hint: "Clique sur les cases pour les découvrir ; une case sans danger est déjà révélée.",
  },

  lovecalc: {
    title: "Love calculator",
    pair: "{first} et {second}",
    score: "**{score} %**",
    self: "S'aimer soi-même, c'est la base.",
    verdict: {
      soulmates: "L'âme sœur, tout simplement.",
      strong: "Une connexion rare, foncez !",
      good: "Belle complicité, ça promet.",
      spark: "Il y a quelque chose, à creuser.",
      faint: "Ce n'est pas gagné, mais rien n'est impossible.",
      none: "Aucune alchimie : restez amis… de loin.",
    },
  },

  tictactoe: {
    title: "Morpion",
    draw: "Match nul !",
    cellTaken: "Cette case est déjà prise.",
    invalidCell: "Case invalide.",
  },

  connect4: {
    title: "Puissance 4",
    draw: "Match nul, la grille est pleine.",
    columnFull: "Cette colonne est pleine.",
    invalidColumn: "Colonne invalide.",
  },

  duel: {
    challenge: "{challenger} défie {opponent} !",
    expiresIn: "L'invitation expire dans {minutes} minutes.",
    acceptButton: "Accepter",
    declineButton: "Refuser",
    noAnswer: "{opponent} n'a pas répondu au défi de {challenger}.",
    declined: "{opponent} a refusé le défi de {challenger}.",
    cancelled: "{challenger} a annulé son défi.",
    selfChallenge: "Tu ne peux pas te défier toi-même.",
    botChallenge: "Tu ne peux pas défier un bot.",
    notForYou: "Ce défi ne t'est pas adressé.",
    notInvolved: "Ce défi ne te concerne pas.",
  },

  hangman: {
    title: "Pendu",
    word: "Mot : `{word}`",
    missed: "Lettres ratées : {letters}",
    missedNone: "aucune",
    mistakes: "Erreurs : {count} / {max}",
    letterRange: "Lettre de {first} à {last}",
    solveButton: "Proposer le mot",
    modalLabel: "Ton mot",
    openStatus: "Tout le monde peut proposer une lettre.",
    ownerStatus: "Partie de {player}.",
    guessLetter: "{player} propose {letter} : {result}.",
    guessWord: "{player} propose le mot {word} : raté.",
    hit: "bien vu",
    miss: "raté",
    wonOpen: "{player} trouve le mot, bravo !",
    wonSolo: {
      zero: "Bravo, tu as trouvé le mot sans aucune erreur !",
      one: "Bravo, tu as trouvé le mot avec {count} erreur !",
      other: "Bravo, tu as trouvé le mot avec {count} erreurs !",
    },
    lost: "Perdu ! Le mot était **{word}**.",
    forfeited: "Partie abandonnée. Le mot était **{word}**.",
    notYours: "Cette partie ne t'appartient pas. Lance la tienne avec `/pendu`.",
    invalidLetter: "Lettre invalide.",
    alreadyGuessed: "Cette lettre a déjà été proposée.",
    lettersOnly: "Le mot ne doit contenir que des lettres.",
    ownerOnlyForfeit: "Seul le membre qui a lancé la partie peut l'abandonner.",
  },

  wordle: {
    title: "Wordle",
    subtitle: "Partie de {player} · mot de {length} lettres, accents ignorés",
    absent: "Lettres absentes : {letters}",
    attempt: "Essai {current} sur {max}.",
    guessButton: "Proposer un mot",
    modalLabel: "Mot de {length} lettres",
    won: {
      one: "Trouvé en {count} essai !",
      other: "Trouvé en {count} essais !",
    },
    lost: "Perdu ! Le mot était **{word}**.",
    forfeited: "Partie abandonnée. Le mot était **{word}**.",
    notYours: "Cette partie ne t'appartient pas. Lance la tienne avec `/wordle`.",
    wrongLength: "Propose un mot de {length} lettres.",
    unknownWord: "`{word}` ne fait pas partie du dictionnaire de Gaulia.",
    alreadyTried: "Tu as déjà proposé ce mot.",
  },
};

export default fun;
