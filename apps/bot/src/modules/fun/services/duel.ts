import { ButtonStyle, type ButtonInteraction, type ChatInputCommandInteraction } from "discord.js";

import { GauliaError } from "../../../core/errors";
import type { Translator } from "../../../i18n";
import { connect4Games, startConnect4 } from "./connect4";
import { funButton, funPayload, funRow, parseDifficulty, type Difficulty } from "./funUi";
import { GameStore } from "./gameStore";
import { startTicTacToe, ticTacToeGames } from "./tictactoe";

export type DuelGame = "connect4" | "tictactoe";

const INVITATION_TTL_MS = 2 * 60_000;
const INVITATION_TTL_MINUTES = INVITATION_TTL_MS / 60_000;

interface Invitation {
  game: DuelGame;
  challengerId: string;
  opponentId: string;
}

const invitations = new GameStore<Invitation>({
  idleMs: INVITATION_TTL_MS,
  renderExpired: (invitation, t) =>
    funPayload([
      `### ${t(`fun.${invitation.game}.title`)}`,
      t("fun.duel.noAnswer", {
        opponent: `<@${invitation.opponentId}>`,
        challenger: `<@${invitation.challengerId}>`,
      }),
    ]),
});

async function launchGame(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  game: DuelGame,
  players: [string, string | null],
  difficulty: Difficulty,
  t: Translator,
): Promise<void> {
  const store = game === "connect4" ? connect4Games : ticTacToeGames;
  const { gameId, payload } =
    game === "connect4"
      ? startConnect4(players, difficulty, t)
      : startTicTacToe(players, difficulty, t);

  if (interaction.isButton()) {
    await interaction.update(payload);
  } else {
    await interaction.reply(payload);
  }
  store.attach(gameId, interaction);
}

/** Without an opponent (or when aiming at Gaulia): a game against the AI; otherwise an invitation. */
export async function startDuelCommand(
  interaction: ChatInputCommandInteraction,
  game: DuelGame,
  t: Translator,
): Promise<void> {
  const opponent = interaction.options.getUser("opponent");

  if (!opponent || opponent.id === interaction.client.user.id) {
    const difficulty = parseDifficulty(interaction.options.getString("difficulty"));
    await launchGame(interaction, game, [interaction.user.id, null], difficulty, t);
    return;
  }
  if (opponent.id === interaction.user.id) throw new GauliaError("fun.duel.selfChallenge");
  if (opponent.bot) throw new GauliaError("fun.duel.botChallenge");

  const invitation: Invitation = {
    game,
    challengerId: interaction.user.id,
    opponentId: opponent.id,
  };
  const invitationId = invitations.create(invitation, t);

  await interaction.reply(
    funPayload(
      [
        `### ${t(`fun.${game}.title`)}`,
        t("fun.duel.challenge", {
          challenger: `<@${invitation.challengerId}>`,
          opponent: `<@${invitation.opponentId}>`,
        }),
        `-# ${t("fun.duel.expiresIn", { minutes: INVITATION_TTL_MINUTES })}`,
      ],
      [
        funRow(
          funButton(
            `fun:duel-accept:${invitationId}`,
            t("fun.duel.acceptButton"),
            ButtonStyle.Success,
          ),
          funButton(
            `fun:duel-decline:${invitationId}`,
            t("fun.duel.declineButton"),
            ButtonStyle.Danger,
          ),
        ),
      ],
      [opponent.id],
    ),
  );
  invitations.attach(invitationId, interaction);
}

export async function acceptDuel(
  interaction: ButtonInteraction,
  invitationId: string,
  t: Translator,
): Promise<void> {
  const invitation = invitations.require(invitationId);
  if (interaction.user.id !== invitation.opponentId) {
    throw new GauliaError("fun.duel.notForYou");
  }
  invitations.finish(invitationId);

  const players: [string, string] =
    Math.random() < 0.5
      ? [invitation.challengerId, invitation.opponentId]
      : [invitation.opponentId, invitation.challengerId];
  await launchGame(interaction, invitation.game, players, "normal", t);
}

export async function declineDuel(
  interaction: ButtonInteraction,
  invitationId: string,
  t: Translator,
): Promise<void> {
  const invitation = invitations.require(invitationId);
  const { challengerId, opponentId } = invitation;
  if (interaction.user.id !== opponentId && interaction.user.id !== challengerId) {
    throw new GauliaError("fun.duel.notInvolved");
  }
  invitations.finish(invitationId);

  await interaction.update(
    funPayload([
      `### ${t(`fun.${invitation.game}.title`)}`,
      interaction.user.id === opponentId
        ? t("fun.duel.declined", {
            opponent: `<@${opponentId}>`,
            challenger: `<@${challengerId}>`,
          })
        : t("fun.duel.cancelled", { challenger: `<@${challengerId}>` }),
    ]),
  );
}
