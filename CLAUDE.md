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

Le bot, le site et l'API sont bilingues anglais / français. L'anglais est la langue par défaut :
c'est lui qui est servi quand la langue du lecteur ne peut pas être déterminée.

- **Code** : commentaires, noms de variables, de fonctions, de types et de propriétés en
  **anglais**. Les commentaires restent minimalistes : l'essentiel (le pourquoi, le piège non
  évident), pas la paraphrase du code.
- **Messages de log** : en anglais, en clair dans le code. Ils ne sont pas lus par les
  utilisateurs, donc pas de traduction.
- **Textes affichés** : jamais en dur dans le code, toujours dans un catalogue de traduction.
- **Messages de commit** et **échanges avec le propriétaire du dépôt** : en français.

### Où vivent les traductions

| Application | Chemin                                          | Chargement                              |
| ----------- | ----------------------------------------------- | --------------------------------------- |
| Bot         | `apps/bot/src/locales/[lang]/[module].ts`       | automatique, par `apps/bot/src/i18n`    |
| Site        | `apps/dashboard/src/locales/[lang]/[module].ts` | `apps/dashboard/src/i18n/dictionary.ts` |
| API         | `apps/api/src/locales/[lang]/[module].ts`       | `apps/api/src/i18n`                     |

Le fichier anglais définit la structure et exporte son type ; le fichier français l'importe et
s'y conforme. Une clé manquante ou en trop côté français est une erreur de compilation.

### Comment la langue est choisie

- **Bot** : choix explicite du membre (`/language me`), puis la langue de son client Discord, puis
  le choix du serveur (`/language server`), puis la langue du serveur sur Discord, puis l'anglais.
  Un message lu par tout un salon suit la langue du serveur, jamais celle d'un membre.
- **Site** : cookie `gaulia-lang` posé par le bouton de langue, puis l'en-tête `Accept-Language`
  du navigateur, puis l'anglais. La langue est résolue côté serveur pour que la page arrive déjà
  traduite.
- **API** : l'en-tête `Accept-Language` de la requête, que le dashboard renseigne avec la langue
  du lecteur.

### Commandes Discord

On s'appuie au maximum sur les localisations natives de Discord. Le nom canonique d'une commande
est **anglais** et le français est envoyé en `name_localizations`, via les helpers
`localizeSlashCommand`, `localizeOption`, `localizeContextMenu` et `localizeChoices`. Discord
n'envoie jamais que le nom canonique : `interaction.options.getString("query")` et
`getSubcommand()` s'écrivent donc toujours en anglais.

## Branches

- `dev` : instance de test, branche de travail par défaut.
- `main` : production, un push y déclenche un rebuild automatique. Ne jamais y pousser
  sans l'accord explicite du propriétaire du dépôt.

## Avant de pousser

```bash
npm run typecheck
npm run lint
npm run i18n:check
```

`i18n:check` échoue sur les deux trous que le compilateur ne voit pas : une clé passée à
`t("...")` qu'aucun catalogue anglais ne définit, et un `{placeholder}` présent dans une langue
et absent de l'autre. Les clés construites à l'exécution ne peuvent pas être vérifiées et sont
comptées à part.
