import { randomBytes } from "node:crypto";

import { GauliaError } from "../../../core/errors";
import type { V2MessagePayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";

export const GAME_IDLE_MS = 10 * 60_000;
const SWEEP_INTERVAL_MS = 30_000;

interface ReplyEditor {
  editReply(payload: V2MessagePayload): Promise<unknown>;
}

interface Entry<T> {
  state: T;
  /** Language the game was started in, so the expiry notice matches the board. */
  t: Translator;
  expiresAt: number;
  lastInteraction?: ReplyEditor;
}

/**
 * Running games, kept in the shard process memory only. On expiry the message is frozen through the
 * last interaction received, whose token stays valid for 15 minutes (longer than the idle delay).
 */
export class GameStore<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly idleMs: number;
  private readonly renderExpired: (state: T, t: Translator) => V2MessagePayload;

  constructor(options: {
    idleMs: number;
    renderExpired: (state: T, t: Translator) => V2MessagePayload;
  }) {
    this.idleMs = options.idleMs;
    this.renderExpired = options.renderExpired;
    setInterval(() => this.sweep(), SWEEP_INTERVAL_MS).unref();
  }

  create(state: T, t: Translator): string {
    const id = randomBytes(6).toString("base64url");
    this.entries.set(id, { state, t, expiresAt: Date.now() + this.idleMs });
    return id;
  }

  /** Returns the game and pushes its expiry back. */
  require(id: string): T {
    const entry = this.entries.get(id);
    if (!entry || entry.expiresAt <= Date.now()) {
      throw new GauliaError("fun.error.gameOver");
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
      void entry.lastInteraction
        ?.editReply(this.renderExpired(entry.state, entry.t))
        .catch(() => undefined);
    }
  }
}
