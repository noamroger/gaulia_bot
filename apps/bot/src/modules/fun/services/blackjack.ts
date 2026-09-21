import { randomInt } from "node:crypto";

import { ButtonStyle } from "discord.js";

import { GauliaError } from "../../../core/errors";
import type { Translator } from "../../../i18n";
import { funButton, funPayload, funRow, type FunPayload } from "./funUi";
import { GAME_IDLE_MS, GameStore } from "./gameStore";

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
const BLACKJACK = 21;
const DEALER_STANDS_AT = 17;
const HIDDEN_SCORE = "?";

type Rank = (typeof RANKS)[number];
type Outcome = "blackjack" | "win" | "dealerBust" | "lose" | "bust" | "push" | null;

/** Face cards are not written the same way in every language (J/Q/K, V/D/R). */
const FACE_KEYS: Partial<Record<Rank, string>> = { A: "ace", J: "jack", Q: "queen", K: "king" };

interface Card {
  rank: Rank;
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
  if (card.rank === "J" || card.rank === "Q" || card.rank === "K") return 10;
  return Number(card.rank);
}

/** Aces count as 11, then as 1 for as long as the hand goes over 21. */
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

function rankLabel(rank: Rank, t: Translator): string {
  const face = FACE_KEYS[rank];
  return face ? t(`fun.blackjack.faces.${face}`) : rank;
}

function formatHand(cards: Card[], hideHoleCard: boolean, t: Translator): string {
  return cards
    .map((card, index) =>
      hideHoleCard && index === 1 ? "`??`" : `\`${rankLabel(card.rank, t)}${card.suit}\``,
    )
    .join(" ");
}

/** A null `gameId` means the game expired and is shown without controls. */
export function renderBlackjack(
  game: BlackjackGame,
  gameId: string | null,
  t: Translator,
): FunPayload {
  const hidden = game.outcome === null;
  const status = game.outcome
    ? t(`fun.blackjack.outcome.${game.outcome}`)
    : gameId === null
      ? t("fun.game.expired")
      : t("fun.blackjack.prompt");

  const lines = [
    `### ${t("fun.blackjack.title")}`,
    `-# ${t("fun.blackjack.owner", { player: `<@${game.playerId}>` })}`,
    "",
    t("fun.blackjack.dealerHand", {
      score: hidden ? HIDDEN_SCORE : handValue(game.dealer),
      cards: formatHand(game.dealer, hidden, t),
    }),
    t("fun.blackjack.playerHand", {
      score: handValue(game.player),
      cards: formatHand(game.player, false, t),
    }),
    "",
    status,
  ];

  if (!gameId) return funPayload(lines);

  if (game.outcome) {
    return funPayload(lines, [
      funRow(
        funButton(
          `fun:bj-new:${game.playerId}`,
          t("fun.blackjack.replayButton"),
          ButtonStyle.Success,
        ),
      ),
    ]);
  }

  return funPayload(lines, [
    funRow(
      funButton(`fun:bj-hit:${gameId}`, t("fun.blackjack.hitButton"), ButtonStyle.Primary),
      funButton(`fun:bj-stand:${gameId}`, t("fun.blackjack.standButton"), ButtonStyle.Secondary),
    ),
  ]);
}

export const blackjackGames = new GameStore<BlackjackGame>({
  idleMs: GAME_IDLE_MS,
  renderExpired: (game, t) => renderBlackjack(game, null, t),
});

function playDealer(game: BlackjackGame): void {
  while (handValue(game.dealer) < DEALER_STANDS_AT) game.dealer.push(draw(game));

  const player = handValue(game.player);
  const dealer = handValue(game.dealer);
  game.outcome =
    dealer > BLACKJACK ? "dealerBust" : player > dealer ? "win" : player < dealer ? "lose" : "push";
}

export function startBlackjack(
  playerId: string,
  t: Translator,
): { gameId: string; payload: FunPayload } {
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

  const gameId = blackjackGames.create(game, t);
  if (game.outcome) blackjackGames.finish(gameId);
  return { gameId, payload: renderBlackjack(game, gameId, t) };
}

function requirePlayer(gameId: string, userId: string): BlackjackGame {
  const game = blackjackGames.require(gameId);
  if (game.playerId !== userId) throw new GauliaError("fun.blackjack.notYours");
  return game;
}

export function hitBlackjack(gameId: string, userId: string, t: Translator): FunPayload {
  const game = requirePlayer(gameId, userId);
  game.player.push(draw(game));

  const value = handValue(game.player);
  if (value > BLACKJACK) {
    game.outcome = "bust";
  } else if (value === BLACKJACK) {
    playDealer(game);
  }
  if (game.outcome) blackjackGames.finish(gameId);

  return renderBlackjack(game, gameId, t);
}

export function standBlackjack(gameId: string, userId: string, t: Translator): FunPayload {
  const game = requirePlayer(gameId, userId);
  playDealer(game);
  blackjackGames.finish(gameId);
  return renderBlackjack(game, gameId, t);
}
