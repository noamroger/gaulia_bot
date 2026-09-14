/**
 * Gestionnaire de cooldowns en mémoire, par commande et par utilisateur.
 * Suffisant pour un process shard unique : chaque process a ses propres cooldowns,
 * ce qui est acceptable pour une protection anti-spam (pas une donnée critique à synchroniser).
 */
export class CooldownManager {
  private readonly expiryByKey = new Map<string, number>();

  private key(commandName: string, userId: string): string {
    return `${commandName}:${userId}`;
  }

  /** Retourne le nombre de secondes restantes si en cooldown, sinon 0 et démarre le cooldown. */
  public consume(commandName: string, userId: string, cooldownSeconds: number): number {
    if (cooldownSeconds <= 0) return 0;

    const key = this.key(commandName, userId);
    const now = Date.now();
    const expiresAt = this.expiryByKey.get(key);

    if (expiresAt && expiresAt > now) {
      return Math.ceil((expiresAt - now) / 1000);
    }

    this.expiryByKey.set(key, now + cooldownSeconds * 1000);
    return 0;
  }
}
