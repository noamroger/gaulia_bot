# Conventions du dépôt Gaulia

## Typographie

**Jamais de tiret long (cadratin, U+2014).** Ni dans le code, ni dans les commentaires, ni
dans les textes affichés aux utilisateurs (bot, dashboard, mails), ni dans la documentation.
On écrit un tiret court « - » (U+002D) à la place.

Quand le tiret long encadrait une incise (« … U+2014 précision U+2014 … »), on ne met pas
deux tirets courts : on passe par des parenthèses ou des virgules, pour que la phrase reste
correcte en français.

Si un tiret long doit être reconnu par du code (une expression régulière qui découpe un titre,
par exemple), on l'écrit en échappement `\u2014` plutôt qu'en caractère littéral.

La même règle vaut pour le tiret demi-cadratin (U+2013) dans les textes rédigés.

Vérification rapide avant de committer :

```bash
git ls-files -z | xargs -0 grep -n $'\u2014'
```

## Langue

Tout ce qui est visible par un utilisateur, ainsi que les commentaires et les messages de
commit, s'écrit en français.

## Branches

- `dev` : instance de test, branche de travail par défaut.
- `main` : production, un push y déclenche un rebuild automatique. Ne jamais y pousser
  sans l'accord explicite du propriétaire du dépôt.

## Avant de pousser

```bash
npm run typecheck
npm run lint
```
