import type { TranslationModule } from "../../i18n/catalog";

const fun = {
  commands: {
    blackjack: {
      name: "blackjack",
      description: "Take on the dealer at blackjack",
      help: {
        details:
          "Get as close to 21 as you can without going over. `Hit` adds a card to your hand, `Stand` lets the dealer play, and the dealer keeps drawing until reaching 17. Face cards are worth 10 and an ace is worth 1 or 11. There is no betting: it is just for fun.",
        examples: ["blackjack"],
      },
    },

    minesweeper: {
      name: "minesweeper",
      description: "Generate a minesweeper grid to uncover",
      help: {
        details:
          "Posts a grid of hidden cells: click them to uncover them without hitting a mine. Each number tells you how many mines sit in the neighbouring cells, and one safe cell is revealed to get you started. Easy: 6×6 and 5 mines, normal: 8×8 and 10 mines, hard: 9×9 and 16 mines.",
        examples: ["minesweeper", "minesweeper difficulty:Hard"],
      },
      options: {
        difficulty: {
          name: "difficulty",
          description: "Grid size and number of mines (normal by default)",
          choices: {
            easy: "Easy",
            normal: "Normal",
            hard: "Hard",
          },
        },
      },
    },

    lovecalc: {
      name: "lovecalc",
      description: "Work out the love compatibility between two members",
      help: {
        details:
          "Works out a compatibility score from 0 to 100% out of the Discord IDs of both members. The result never changes for a given pair, whichever order you give them in, and nothing is stored. Without a second member, the score is worked out with you.",
        examples: ["lovecalc member:@Name", "lovecalc member:@Name member2:@Other"],
      },
      options: {
        member: {
          name: "member",
          description: "First member",
        },
        member2: {
          name: "member2",
          description: "Second member (you by default)",
        },
      },
    },

    tictactoe: {
      name: "tictactoe",
      description: "Start a game of tic-tac-toe against a member or against Gaulia",
      help: {
        details:
          "Line up 3 marks on the grid before your opponent by clicking the cells. With an opponent, they get a challenge to accept within 2 minutes and the first player is drawn at random. Without one, you face Gaulia: on hard, she never loses. A game with no move for 10 minutes expires.",
        examples: ["tictactoe opponent:@Name", "tictactoe difficulty:Easy"],
      },
      options: {
        opponent: {
          name: "opponent",
          description: "Member to challenge; without one, you play against Gaulia",
        },
        difficulty: {
          name: "difficulty",
          description: "Difficulty when you play against Gaulia (normal by default)",
          choices: {
            easy: "Easy",
            normal: "Normal",
            hard: "Hard",
          },
        },
      },
    },

    hangman: {
      name: "hangman",
      description: "Start a game of hangman and guess the hidden word",
      help: {
        details:
          "Guess the word letter by letter with the menus, or go straight for the whole word. After 6 mistakes the game is lost, and a wrong word counts as a mistake. Accents are ignored. With `open`, every member of the channel plays together.",
        examples: ["hangman", "hangman open:True"],
      },
      options: {
        open: {
          name: "open",
          description: "Let every member of the channel suggest letters (no by default)",
        },
      },
    },

    connect4: {
      name: "connect4",
      description: "Start a game of Connect 4 against a member or against Gaulia",
      help: {
        details:
          "Line up 4 discs across, down or diagonally before your opponent. With an opponent, they get a challenge to accept within 2 minutes and the first player is drawn at random. Without one, you face Gaulia at the difficulty you pick. A game with no move for 10 minutes expires.",
        examples: ["connect4 opponent:@Name", "connect4 difficulty:Hard"],
      },
      options: {
        opponent: {
          name: "opponent",
          description: "Member to challenge; without one, you play against Gaulia",
        },
        difficulty: {
          name: "difficulty",
          description: "Difficulty when you play against Gaulia (normal by default)",
          choices: {
            easy: "Easy",
            normal: "Normal",
            hard: "Hard",
          },
        },
      },
    },

    wordle: {
      name: "wordle",
      description: "Find a five-letter word in six tries",
      help: {
        details:
          "Offer five-letter words to find the hidden one. After each try, a green square marks a letter in the right place, a yellow square a letter that sits elsewhere and a black square a letter that is not in the word. Accents are ignored and the word you offer has to be in Gaulia's dictionary.",
        examples: ["wordle"],
      },
    },
  },

  /** Inline wording, used inside a sentence rather than as a choice label. */
  difficulty: {
    easy: "easy",
    normal: "normal",
    hard: "hard",
  },

  /** Shown as the opponent when a game is played against the bot. */
  bot: "Gaulia",

  error: {
    staleButton: "This button is no longer valid.",
    gameOver: "This game is over or has expired.",
    channelRestricted: "Fun commands are limited to these channels: {channels}",
  },

  game: {
    expired: "Game expired after 10 minutes of inactivity.",
    forfeitButton: "Give up",
    difficultyNote: "{difficulty} difficulty",
  },

  /** Shared by the two board games played against a member or against Gaulia. */
  match: {
    players: "{firstMark} {first} against {secondMark} {second}",
    turn: "{player} {mark} to play",
    win: "{player} {mark} wins the game!",
    forfeited: "{loser} gives up, {winner} wins the game.",
    notPlaying: "You are not part of this game.",
    notYourTurn: "It is not your turn.",
  },

  blackjack: {
    title: "Blackjack",
    owner: "Game of {player}",
    dealerHand: "**Dealer** ({score}): {cards}",
    playerHand: "**Your hand** ({score}): {cards}",
    prompt: "Hit or stand?",
    hitButton: "Hit",
    standButton: "Stand",
    replayButton: "Play again",
    notYours: "This game is not yours. Start your own with `/blackjack`.",
    startYourOwn: "Start your own game with `/blackjack`.",
    faces: {
      ace: "A",
      jack: "J",
      queen: "Q",
      king: "K",
    },
    outcome: {
      blackjack: "Blackjack! You win.",
      win: "You win!",
      dealerBust: "The dealer goes over 21, you win!",
      lose: "The dealer wins.",
      bust: "You go over 21, you lose.",
      push: "Push.",
    },
  },

  minesweeper: {
    title: "Minesweeper",
    summary: "{size}×{size} grid · {mines} mines · {difficulty} difficulty",
    hint: "Click the cells to uncover them; one safe cell is already revealed.",
  },

  lovecalc: {
    title: "Love calculator",
    pair: "{first} and {second}",
    score: "**{score}%**",
    self: "Loving yourself is where it all starts.",
    verdict: {
      soulmates: "Soulmates, plain and simple.",
      strong: "A rare connection, go for it!",
      good: "Real chemistry, this one looks promising.",
      spark: "Something is there, worth digging into.",
      faint: "Far from a sure thing, but nothing is impossible.",
      none: "No spark at all: stay friends, from a distance.",
    },
  },

  tictactoe: {
    title: "Tic-tac-toe",
    draw: "It is a draw!",
    cellTaken: "This cell is already taken.",
    invalidCell: "Invalid cell.",
  },

  connect4: {
    title: "Connect 4",
    draw: "It is a draw, the grid is full.",
    columnFull: "This column is full.",
    invalidColumn: "Invalid column.",
  },

  duel: {
    challenge: "{challenger} challenges {opponent}!",
    expiresIn: "The invitation expires in {minutes} minutes.",
    acceptButton: "Accept",
    declineButton: "Decline",
    noAnswer: "{opponent} did not answer the challenge from {challenger}.",
    declined: "{opponent} turned down the challenge from {challenger}.",
    cancelled: "{challenger} called off the challenge.",
    selfChallenge: "You cannot challenge yourself.",
    botChallenge: "You cannot challenge a bot.",
    notForYou: "This challenge is not addressed to you.",
    notInvolved: "This challenge does not involve you.",
  },

  hangman: {
    title: "Hangman",
    word: "Word: `{word}`",
    missed: "Missed letters: {letters}",
    missedNone: "none",
    mistakes: "Mistakes: {count} / {max}",
    letterRange: "Letter from {first} to {last}",
    solveButton: "Guess the word",
    modalLabel: "Your word",
    openStatus: "Anyone can suggest a letter.",
    ownerStatus: "Game of {player}.",
    guessLetter: "{player} suggests {letter}: {result}.",
    guessWord: "{player} suggests the word {word}: no luck.",
    hit: "good call",
    miss: "no luck",
    wonOpen: "{player} found the word, well played!",
    wonSolo: {
      zero: "Well done, you found the word without a single mistake!",
      one: "Well done, you found the word with {count} mistake!",
      other: "Well done, you found the word with {count} mistakes!",
    },
    lost: "You lose! The word was **{word}**.",
    forfeited: "Game given up. The word was **{word}**.",
    notYours: "This game is not yours. Start your own with `/hangman`.",
    invalidLetter: "Invalid letter.",
    alreadyGuessed: "That letter has already been suggested.",
    lettersOnly: "The word may only contain letters.",
    ownerOnlyForfeit: "Only the member who started the game can give it up.",
  },

  wordle: {
    title: "Wordle",
    subtitle: "Game of {player} · {length}-letter word, accents ignored",
    absent: "Missing letters: {letters}",
    attempt: "Try {current} of {max}.",
    guessButton: "Guess a word",
    modalLabel: "{length}-letter word",
    won: {
      one: "Found in {count} try!",
      other: "Found in {count} tries!",
    },
    lost: "You lose! The word was **{word}**.",
    forfeited: "Game given up. The word was **{word}**.",
    notYours: "This game is not yours. Start your own with `/wordle`.",
    wrongLength: "Suggest a word of {length} letters.",
    unknownWord: "`{word}` is not part of Gaulia's dictionary.",
    alreadyTried: "You have already suggested that word.",
  },
} satisfies TranslationModule;

export type FunStrings = typeof fun;

export default fun;
