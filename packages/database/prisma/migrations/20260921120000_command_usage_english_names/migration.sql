-- The canonical name of six commands became English (French now travels as a Discord
-- localization). Their daily counters would otherwise split in two in the admin panel, so the
-- rows recorded under the old name are merged into the new one.
--
-- Prisma does not wrap a migration file in a transaction, and the merge takes two statements: an
-- interruption between them would leave the old rows in place, so replaying the migration would
-- add their counters a second time. BEGIN / COMMIT makes the merge all or nothing.

BEGIN;

WITH renames (old_name, new_name) AS (
    VALUES
        ('aventure', 'adventure'),
        ('demineur', 'minesweeper'),
        ('morpion', 'tictactoe'),
        ('pendu', 'hangman'),
        ('puissance4', 'connect4'),
        ('Avertir l''utilisateur', 'Warn user')
)
INSERT INTO "command_usage_daily" ("date", "commandName", "category", "count")
SELECT usage."date", renames.new_name, usage."category", usage."count"
FROM "command_usage_daily" AS usage
JOIN renames ON usage."commandName" = renames.old_name
ON CONFLICT ("date", "commandName")
DO UPDATE SET "count" = "command_usage_daily"."count" + EXCLUDED."count";

DELETE FROM "command_usage_daily"
WHERE "commandName" IN (
    'aventure',
    'demineur',
    'morpion',
    'pendu',
    'puissance4',
    'Avertir l''utilisateur'
);

COMMIT;
