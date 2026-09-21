import type { UserPreference } from "@prisma/client";

import { prisma } from "../client";

/** Language override for a user, or null when they follow their Discord locale. */
export async function getUserLanguage(userId: string): Promise<string | null> {
  const preference = await prisma.userPreference.findUnique({
    where: { userId },
    select: { language: true },
  });
  return preference?.language ?? null;
}

/** Language overrides for several users at once, keyed by user id. */
export async function getUserLanguages(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();

  const preferences = await prisma.userPreference.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, language: true },
  });
  return new Map(preferences.map((preference) => [preference.userId, preference.language]));
}

export async function setUserLanguage(userId: string, language: string): Promise<UserPreference> {
  return prisma.userPreference.upsert({
    where: { userId },
    update: { language },
    create: { userId, language },
  });
}

export async function deleteUserPreference(userId: string): Promise<void> {
  await prisma.userPreference.deleteMany({ where: { userId } });
}
