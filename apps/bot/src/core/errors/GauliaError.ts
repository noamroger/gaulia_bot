/**
 * Erreur "attendue" (validation métier, permission manquante, etc.) dont le message est
 * directement présentable à l'utilisateur, contrairement à une erreur technique inattendue.
 */
export class GauliaError extends Error {
  public readonly userMessage: string;

  constructor(userMessage: string) {
    super(userMessage);
    this.name = "GauliaError";
    this.userMessage = userMessage;
  }
}
