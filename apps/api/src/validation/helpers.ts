import { z } from "zod";

export const snowflakeSchema = z.string().regex(/^\d{17,20}$/);

/** Vrai si chaque identifiant fourni (null/undefined ignorés) existe dans la liste du serveur. */
export function allIdsKnown(
  ids: ReadonlyArray<string | null | undefined>,
  known: ReadonlyArray<{ id: string }>,
): boolean {
  const knownIds = new Set(known.map((item) => item.id));
  return ids.every((id) => id === null || id === undefined || knownIds.has(id));
}

/** Retire les clés `undefined` pour ne mettre à jour que les champs envoyés. */
export function definedOnly<T extends Record<string, unknown>>(
  value: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as { [K in keyof T]?: Exclude<T[K], undefined> };
}
