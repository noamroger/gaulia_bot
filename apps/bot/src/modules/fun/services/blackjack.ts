import { randomInt } from "node:crypto";

import { ButtonStyle } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { funButton, funPayload, funRow, type FunPayload } from "./funUi";
import { GAME_IDLE_MS, GameStore } from "./gameStore";

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "V", "D", "R"] as const;
const BLACKJACK = 21;
const DEALER_STANDS_AT = 17;

type Outcome = "blackjack" | "win" | "dealer-bust" | "lose" | "bust" | "push" | null;

const OUTCOME_TEXT: Record<Exclude<Outcome, null>, string> = {
  blackjack: "Blackjack ! Tu gagnes.",
  win: "Tu gagnes !",
  "dealer-bust": "Le croupier dépasse 21, tu gagnes !",
  lose: "Le croupier gagne.",
  bust: "Tu dépasses 21, perdu.",
  push: "Égalité.",
};

interface Card {
  rank: (typeof RANKS)[number];
  suit: (typeof SUITS)[number];
}

export interface BlackjackGame {
  deck: Card[];
  player: Card[];
  dealer: Card[];
  playerId: string;
  outcome: Outcome;
}

function shuffledDeck(): Card[] {
  const deck = SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
  for (let index = deck.length - 1; index > 0; index--) {
    const swap = randomInt(index + 1);
    [deck[index], deck[swap]] = [deck[swap]!, deck[index]!];
  }
  return deck;
}

function cardPoints(card: Card): number {
  if (card.rank === "A") return 11;
  if (card.rank === "V" || card.rank === "D" || card.rank === "R") return 10;
  return Number(card.rank);
}

/** Les as valent 11, puis 1 tant que la main dépasse 21. */
export function handValue(cards: Card[]): number {
  let total = cards.reduce((sum, card) => sum + cardPoints(card), 0);
  let aces = cards.filter((card) => card.rank === "A").length;
  while (total > BLACKJACK && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function draw(game: BlackjackGame): Card {
  return game.deck.pop()!;
}

function formatHand(cards: Card[], hideHoleCard: boolean): string {
  return cards
    .map((card, index) => (hideHoleCard && index === 1 ? "`??`" : `\`${card.rank}${card.suit}\``))
    .join(" ");
}

/** `gameId` null : partie expirée, affichée sans contrôles. */
export function renderBlackjack(game: BlackjackGame, gameId: string | null): FunPayload {
  const hidden = game.outcome === null;
  const status = game.outcome
    ? OUTCOME_TEXT[game.outcome]
    : gameId === null
      ? "Partie expirée après 10 minutes d'inactivité."
      : "Tirer une carte ou rester ?";

  const lines = [
    "### Blackjack",
    `-# Partie de <@${game.playerId}>`,
    "",
    `**Croupier** (${hidden ? "?" : handValue(game.dealer)}) : ${formatHand(game.dealer, hidden)}`,
    `**Ta main** (${handValue(game.player)}) : ${formatHand(game.player, false)}`,
    "",
    status,
  ];

  if (!gameId) return funPayload(lines);

  if (game.outcome) {
    return funPayload(lines, [
      funRow(funButton(`fun:bj-new:${game.playerId}`, "Rejouer", ButtonStyle.Success)),
    ]);
  }

  return funPayload(lines, [
    funRow(
      funButton(`fun:bj-hit:${gameId}`, "Tirer", ButtonStyle.Primary),
      funButton(`fun:bj-stand:${gameId}`, "Rester", ButtonStyle.Secondary),
    ),
  ]);
}

export const blackjackGames = new GameStore<BlackjackGame>({
  idleMs: GAME_IDLE_MS,
  renderExpired: (game) => renderBlackjack(game, null),
});

function playDealer(game: BlackjackGame): void {
  while (handValue(game.dealer) < DEALER_STANDS_AT) game.dealer.push(draw(game));

  const player = handValue(game.player);
  const dealer = handValue(game.dealer);
  game.outcome =
    dealer > BLACKJACK
      ? "dealer-bust"
      : player > dealer
        ? "win"
        : player < dealer
          ? "lose"
          : "push";
}

export function startBlackjack(playerId: string): { gameId: string; payload: FunPayload } {
  const game: BlackjackGame = {
    deck: shuffledDeck(),
    player: [],
    dealer: [],
    playerId,
    outcome: null,
  };
  game.player.push(draw(game));
  game.dealer.push(draw(game));
  game.player.push(draw(game));
  game.dealer.push(draw(game));

  if (handValue(game.player) === BLACKJACK) {
    game.outcome = handValue(game.dealer) === BLACKJACK ? "push" : "blackjack";
  }

  const gameId = blackjackGames.create(game);
  if (game.outcome) blackjackGames.finish(gameId);
  return { gameId, payload: renderBlackjack(game, gameId) };
}

function requirePlayer(gameId: string, userId: string): BlackjackGame {
  const game = blackjackGames.require(gameId);
  if (game.playerId !== userId) {
    throw new GauliaError("Cette partie ne t'appartient pas. Lance la tienne avec `/blackjack`.");
  }
  return game;
}

export function hitBlackjack(gameId: string, userId: string): FunPayload {
  const game = requirePlayer(gameId, userId);
  game.player.push(draw(game));

  const value = handValue(game.player);
  if (value > BLACKJACK) {
    game.outcome = "bust";
  } else if (value === BLACKJACK) {
    playDealer(game);
  }
  if (game.outcome) blackjackGames.finish(gameId);

  return renderBlackjack(game, gameId);
}

export function standBlackjack(gameId: string, userId: string): FunPayload {
  const game = requirePlayer(gameId, userId);
  playDealer(game);
  blackjackGames.finish(gameId);
  return renderBlackjack(game, gameId);
}
