/**
 * In memory cooldowns, per command and per user. Each shard process keeps its own, which is
 * enough for anti spam and not worth synchronising.
 */
export class CooldownManager {
  private readonly expiryByKey = new Map<string, number>();

  private key(commandName: string, userId: string): string {
    return `${commandName}:${userId}`;
  }

  /** Seconds left when still on cooldown, otherwise 0 and the cooldown starts. */
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
