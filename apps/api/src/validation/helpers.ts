import { z } from "zod";

export const snowflakeSchema = z.string().regex(/^\d{17,20}$/);

/** True when every given id (null/undefined ignored) exists in the server's list. */
export function allIdsKnown(
  ids: ReadonlyArray<string | null | undefined>,
  known: ReadonlyArray<{ id: string }>,
): boolean {
  const knownIds = new Set(known.map((item) => item.id));
  return ids.every((id) => id === null || id === undefined || knownIds.has(id));
}

/** Drops `undefined` keys so only the fields actually sent get updated. */
export function definedOnly<T extends Record<string, unknown>>(
  value: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
}
