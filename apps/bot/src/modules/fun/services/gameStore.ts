import { randomBytes } from "node:crypto";

import { GauliaError } from "../../../core/errors";
import type { V2MessagePayload } from "../../../core/ui/containers";

export const GAME_IDLE_MS = 10 * 60_000;
const SWEEP_INTERVAL_MS = 30_000;

interface ReplyEditor {
  editReply(payload: V2MessagePayload): Promise<unknown>;
}

interface Entry<T> {
  state: T;
  expiresAt: number;
  lastInteraction?: ReplyEditor;
}

/**
 * Parties en cours, uniquement en mémoire du process de shard. À l'expiration, le message est figé
 * via la dernière interaction reçue, dont le jeton reste valable 15 minutes (plus que l'inactivité).
 */
export class GameStore<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly idleMs: number;
  private readonly renderExpired: (state: T) => V2MessagePayload;

  constructor(options: { idleMs: number; renderExpired: (state: T) => V2MessagePayload }) {
    this.idleMs = options.idleMs;
    this.renderExpired = options.renderExpired;
    setInterval(() => this.sweep(), SWEEP_INTERVAL_MS).unref();
  }

  create(state: T): string {
    const id = randomBytes(6).toString("base64url");
    this.entries.set(id, { state, expiresAt: Date.now() + this.idleMs });
    return id;
  }

  /** Retourne la partie en repoussant son expiration. */
  require(id: string): T {
    const entry = this.entries.get(id);
    if (!entry || entry.expiresAt <= Date.now()) {
      throw new GauliaError("Cette partie est terminée ou a expiré.");
    }
    entry.expiresAt = Date.now() + this.idleMs;
    return entry.state;
  }

  attach(id: string, interaction: ReplyEditor): void {
    const entry = this.entries.get(id);
    if (entry) entry.lastInteraction = interaction;
  }

  finish(id: string): void {
    this.entries.delete(id);
  }

  private sweep(): void {
    const now = Date.now();
    for (const [id, entry] of this.entries) {
      if (entry.expiresAt > now) continue;
      this.entries.delete(id);
      void entry.lastInteraction?.editReply(this.renderExpired(entry.state)).catch(() => undefined);
    }
  }
}
