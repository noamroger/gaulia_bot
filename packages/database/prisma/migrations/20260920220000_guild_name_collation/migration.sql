-- Tri par nom dans le panel admin : par défaut Postgres compare les noms octet par octet, ce qui
-- place tous les serveurs commençant par une majuscule avant « alpha ». On passe la colonne sur une
-- collation dictionnaire (ICU), qui range les noms comme le ferait un annuaire.
--
-- La collation choisie est déterministe : la recherche par nom (ILIKE) continue de fonctionner.
-- Si l'installation Postgres n'a pas ICU, la migration ne fait rien plutôt que d'échouer et le tri
-- reste celui d'avant.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_collation WHERE collname = 'en-US-x-icu') THEN
    ALTER TABLE "guilds" ALTER COLUMN "name" TYPE TEXT COLLATE "en-US-x-icu";
  END IF;
END
$$;
