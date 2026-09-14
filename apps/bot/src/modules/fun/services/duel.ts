import { ButtonStyle, type ButtonInteraction, type ChatInputCommandInteraction } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { connect4Games, startConnect4 } from "./connect4";
import { funButton, funPayload, funRow, parseDifficulty, type Difficulty } from "./funUi";
import { GameStore } from "./gameStore";
import { startTicTacToe, ticTacToeGames } from "./tictactoe";

export type DuelGame = "connect4" | "tictactoe";

const GAME_NAMES: Record<DuelGame, string> = { connect4: "Puissance 4", tictactoe: "Morpion" };
const INVITATION_TTL_MS = 2 * 60_000;

interface Invitation {
  game: DuelGame;
  challengerId: string;
  opponentId: string;
}

const invitations = new GameStore<Invitation>({
  idleMs: INVITATION_TTL_MS,
  renderExpired: (invitation) =>
    funPayload([
      `### ${GAME_NAMES[invitation.game]}`,
      `<@${invitation.opponentId}> n'a pas répondu au défi de <@${invitation.challengerId}>.`,
    ]),
});

async function launchGame(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  game: DuelGame,
  players: [string, string | null],
  difficulty: Difficulty,
): Promise<void> {
  const store = game === "connect4" ? connect4Games : ticTacToeGames;
  const { gameId, payload } =
    game === "connect4" ? startConnect4(players, difficulty) : startTicTacToe(players, difficulty);

  if (interaction.isButton()) {
    await interaction.update(payload);
  } else {
    await interaction.reply(payload);
  }
  store.attach(gameId, interaction);
}

/** Sans adversaire (ou en visant Gaulia) : partie contre l'IA ; sinon, invitation à accepter. */
export async function startDuelCommand(
  interaction: ChatInputCommandInteraction,
  game: DuelGame,
): Promise<void> {
  const opponent = interaction.options.getUser("adversaire");

  if (!opponent || opponent.id === interaction.client.user.id) {
    const difficulty = parseDifficulty(interaction.options.getString("difficulte"));
    await launchGame(interaction, game, [interaction.user.id, null], difficulty);
    return;
  }
  if (opponent.id === interaction.user.id) {
    throw new GauliaError("Tu ne peux pas te défier toi-même.");
  }
  if (opponent.bot) throw new GauliaError("Tu ne peux pas défier un bot.");

  const invitation: Invitation = {
    game,
    challengerId: interaction.user.id,
    opponentId: opponent.id,
  };
  const invitationId = invitations.create(invitation);

  await interaction.reply(
    funPayload(
      [
        `### ${GAME_NAMES[game]}`,
        `<@${invitation.challengerId}> défie <@${invitation.opponentId}> !`,
        "-# L'invitation expire dans 2 minutes.",
      ],
      [
        funRow(
          funButton(`fun:duel-accept:${invitationId}`, "Accepter", ButtonStyle.Success),
          funButton(`fun:duel-decline:${invitationId}`, "Refuser", ButtonStyle.Danger),
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
): Promise<void> {
  const invitation = invitations.require(invitationId);
  if (interaction.user.id !== invitation.opponentId) {
    throw new GauliaError("Ce défi ne t'est pas adressé.");
  }
  invitations.finish(invitationId);

  const players: [string, string] =
    Math.random() < 0.5
      ? [invitation.challengerId, invitation.opponentId]
      : [invitation.opponentId, invitation.challengerId];
  await launchGame(interaction, invitation.game, players, "normal");
}

export async function declineDuel(
  interaction: ButtonInteraction,
  invitationId: string,
): Promise<void> {
  const invitation = invitations.require(invitationId);
  const { challengerId, opponentId } = invitation;
  if (interaction.user.id !== opponentId && interaction.user.id !== challengerId) {
    throw new GauliaError("Ce défi ne te concerne pas.");
  }
  invitations.finish(invitationId);

  await interaction.update(
    funPayload([
      `### ${GAME_NAMES[invitation.game]}`,
      interaction.user.id === opponentId
        ? `<@${opponentId}> a refusé le défi de <@${challengerId}>.`
        : `<@${challengerId}> a annulé son défi.`,
    ]),
  );
}
