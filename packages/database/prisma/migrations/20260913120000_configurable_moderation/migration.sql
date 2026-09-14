-- Automod : les réglages figés deviennent des règles JSON configurables (liens, mots, sanctions…).
-- La configuration existante est reprise avant la suppression des anciennes colonnes.
ALTER TABLE "automod_configs" ADD COLUMN     "rules" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "exemptStaff" BOOLEAN NOT NULL DEFAULT true;

UPDATE "automod_configs" SET "rules" = jsonb_build_object(
  'invites', jsonb_build_object(
    'enabled', "antiInvite",
    'allowedInvites', to_jsonb("antiInviteAllowlist"),
    'action', jsonb_build_object('type', 'delete', 'timeoutMinutes', 10)
  ),
  'flood', jsonb_build_object(
    'enabled', "antiFlood",
    'maxMessages', "antiFloodMessages",
    'perSeconds', "antiFloodSeconds",
    'action', jsonb_build_object('type', 'timeout', 'timeoutMinutes', 5)
  ),
  'duplicates', jsonb_build_object(
    'enabled', "antiDuplicate",
    'maxRepeats', "antiDuplicateCount",
    'action', jsonb_build_object('type', 'delete', 'timeoutMinutes', 10)
  )
);

-- AlterTable
ALTER TABLE "automod_configs" DROP COLUMN "antiDuplicate",
DROP COLUMN "antiDuplicateCount",
DROP COLUMN "antiFlood",
DROP COLUMN "antiFloodMessages",
DROP COLUMN "antiFloodSeconds",
DROP COLUMN "antiInvite",
DROP COLUMN "antiInviteAllowlist";

-- CreateTable
CREATE TABLE "moderation_settings" (
    "guildId" TEXT NOT NULL,
    "dmOnSanction" BOOLEAN NOT NULL DEFAULT true,
    "warnEscalation" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_settings_pkey" PRIMARY KEY ("guildId")
);

-- AddForeignKey
ALTER TABLE "moderation_settings" ADD CONSTRAINT "moderation_settings_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
