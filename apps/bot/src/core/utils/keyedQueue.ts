/**
 * Runs the tasks that share a key one after the other, in arrival order, and tasks with different
 * keys freely in parallel. Only covers the current process.
 */
export class KeyedQueue {
  private readonly tails = new Map<string, Promise<void>>();

  async run<T>(key: string, task: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    let release!: () => void;
    const tail = new Promise<void>((resolve) => (release = resolve));
    // `previous` never rejects: every tail is resolved in the `finally` below.
    const chained = previous.then(() => tail);
    this.tails.set(key, chained);

    try {
      await previous;
      return await task();
    } finally {
      release();
      if (this.tails.get(key) === chained) this.tails.delete(key);
    }
  }

  /** Number of keys with a task running or waiting (tests, metrics). */
  get size(): number {
    return this.tails.size;
  }
}
