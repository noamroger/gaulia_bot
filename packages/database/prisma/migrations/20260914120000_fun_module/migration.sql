-- Module fun : salons autorisés par serveur (liste vide = tous les salons).
ALTER TABLE "guilds" ADD COLUMN     "funChannelIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Statistiques : catégorie de chaque commande, pour filtrer le panel admin.
ALTER TABLE "command_usage_daily" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'other';

-- Reprise des compteurs existants d'après le nom des commandes présentes avant ce module.
UPDATE "command_usage_daily" SET "category" = CASE
  WHEN "commandName" IN ('help', 'ping') THEN 'general'
  WHEN "commandName" IN ('ban', 'unban', 'kick', 'timeout', 'untimeout', 'warn', 'warnings', 'case', 'purge', 'modlogs-config', 'Avertir l''utilisateur') THEN 'moderation'
  WHEN "commandName" = 'automod' THEN 'automod'
  WHEN "commandName" IN ('play', 'skip', 'stop', 'pause', 'resume', 'queue', 'nowplaying', 'volume', 'loop', 'shuffle', 'remove', 'seek', 'summon', 'previous', '247', 'filters') THEN 'music'
  WHEN "commandName" = 'premium' THEN 'premium'
  ELSE 'other'
END;
