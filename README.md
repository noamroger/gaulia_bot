# Gaulia

Bot Discord TypeScript modulaire (modération, AutoMod, musique via Lavalink, abonnement **Gaulia
Premium**), accompagné d'un **dashboard web** et d'une **API** dédiée - le tout en monorepo,
partageant un seul schéma Postgres, géré par un unique `docker-compose.yml`.

## Stack

- [discord.js](https://discord.js.org) v14 - Message Components V2 pour toute l'UI du bot (pas d'embeds)
- [lavalink-client](https://github.com/lavalink-devs/lavalink-client) + [Lavalink](https://lavalink.dev) v4 pour la musique
- PostgreSQL + [Prisma](https://www.prisma.io), partagé entre le bot et l'API (`@gaulia/database`)
- `ShardingManager` natif discord.js pour le sharding
- [Fastify](https://fastify.dev) pour l'API (OAuth2 Discord, config des serveurs, stats)
- [Next.js](https://nextjs.org) pour le dashboard (ne parle qu'à l'API, jamais à la base)
- Docker Compose (postgres + lavalink + bot + api + dashboard) - **pas de reverse proxy inclus**,
  branche le tien en amont (voir [Domaine & ports](#domaine--ports))

## Architecture (monorepo npm workspaces)

```
gaulia_bot/
├─ packages/
│  └─ database/              # @gaulia/database - schéma Prisma + repositories, partagé bot+api
│     ├─ prisma/schema.prisma
│     └─ src/{client.ts, repositories/*.repo.ts}
├─ apps/
│  ├─ bot/                   # @gaulia/bot - le bot Discord
│  │  └─ src/{client,config,core,events,handlers,i18n,locales,modules,structures,bot.ts,index.ts}
│  ├─ api/                   # @gaulia/api - Fastify : OAuth2 Discord, config, stats, webhook top.gg
│  │  └─ src/{auth,discord,i18n,locales,plugins,premium,routes,topgg,index.ts}
│  └─ dashboard/             # @gaulia/dashboard - Next.js, ne parle qu'à l'API (fetch + cookies)
│     └─ src/{app,components,i18n,lib,locales}
├─ docker/lavalink/
├─ Dockerfile.bot / Dockerfile.api / Dockerfile.dashboard
└─ docker-compose.yml
```

Dans `apps/bot`, chaque module (`moderation`, `automod`, `music`, `fun`, `premium`, `adventure`)
suit la même structure interne : `commands/`, `services/`, `events/`, `components/` (selon besoin).
Les commandes et events du bot sont chargés dynamiquement au démarrage - pas besoin de les
enregistrer manuellement ailleurs.

`adventure` est le plus gros module : ses services sont rangés par domaine
(`services/{access,character,combat,dungeon,economy,events,exploration,inventory,progress}/`), son
contenu de jeu est isolé dans `data/`, ses vues Components V2 dans `ui/` et une fonction par
sous-commande dans `handlers/`. Attention : seuls `commands/` et `components/` sont des noms
réservés (le chargeur y cherche des commandes et des composants, à n'importe quelle profondeur) -
d'où le dossier `handlers/` pour les sous-commandes.

**Comment le bot, l'API et le dashboard communiquent :**

- Le bot et l'API importent tous les deux `@gaulia/database` (même schéma, mêmes repositories) -
  aucun ne réimplémente sa propre couche d'accès aux données.
- Le dashboard ne fait **jamais** de requête à Postgres : uniquement des `fetch` vers l'API
  (cookies de session inclus). C'est l'API seule qui parle à la base.
- Le bot n'a pas d'API HTTP interne : les stats "live" (nombre de serveurs, ping, uptime par
  shard) passent par un heartbeat écrit en base toutes les ~20s (`apps/bot/src/core/heartbeat`),
  lu par l'API : totaux publics pour la page d'accueil (`GET /stats`, mis en cache 60 s) et détail
  par shard réservé au panel admin (`GET /admin/stats`). La configuration (logs, automod, warns, statut premium) est un
  CRUD classique sur Postgres, sans dépendre du process du bot.

## Langues

Le bot, le site et l'API sont bilingues anglais / français, l'anglais étant la langue servie quand
celle du lecteur ne peut pas être déterminée. Les textes ne vivent jamais dans le code : chaque app
a son arborescence `src/locales/[langue]/[module].ts`, le fichier anglais définit la structure et
exporte son type, le français l'importe et s'y conforme - une clé manquante est une erreur de
compilation.

- **Bot** : `apps/bot/src/i18n` charge les catalogues tout seul. Un membre choisit sa langue avec
  `/language me`, un serveur la sienne avec `/language server` (les deux acceptent `auto`). Ordre
  de résolution pour une réponse personnelle : choix du membre, langue de son client Discord,
  choix du serveur, langue du serveur sur Discord, anglais. Un message lu par tout un salon suit
  la langue du serveur.
- **Commandes Discord** : le nom canonique est anglais, le français part en `name_localizations`.
  Un membre francophone voit donc toujours `/aventure`, `/pendu`, `/morpion`, et le code ne lit
  jamais que le nom canonique.
- **Site** : bouton de langue dans la barre de navigation et dans le pied de page, mémorisé dans le
  cookie `gaulia-lang` ; sinon l'en-tête `Accept-Language` du navigateur, sinon l'anglais. La
  langue est résolue côté serveur, la page arrive donc déjà traduite.
- **API** : répond dans la langue de l'en-tête `Accept-Language`, que le dashboard renseigne.
- **Contenu de jeu** (objets, quêtes, scénario, listes de blindtest) : bilingue dans
  `packages/database/src/data`, puisque le bot, l'API et le panel admin le lisent tous les trois.

Le détail des conventions est dans `CLAUDE.md` à la racine.

## Prérequis

- Node.js ≥ 20
- Docker + Docker Compose (recommandé) - ou Postgres/Lavalink installés manuellement
- Un reverse proxy déjà en place devant cette machine Docker (le tien - ce compose n'en fournit pas),
  capable de terminer le TLS et de router deux domaines vers deux ports (voir
  [Domaine & ports](#domaine--ports))
- Une application Discord créée sur le [portail développeur](https://discord.com/developers/applications),
  avec une **redirect URI OAuth2** enregistrée (onglet OAuth2) correspondant à `DISCORD_REDIRECT_URI`

## Démarrage rapide (Docker, production)

1. Configure ton reverse proxy en amont pour router (voir [Domaine & ports](#domaine--ports)) :
   - `gauliabot.xyz` → cette machine, port **4500**
   - `api.gauliabot.xyz` → cette machine, port **4501**
2. Renseigne `.env` : `DISCORD_REDIRECT_URI`/`DASHBOARD_URL`/`NEXT_PUBLIC_API_URL` avec tes vrais
   domaines publics (voir `.env.example`) - le token du bot et les secrets
   Postgres/Lavalink/JWT sont déjà pré-remplis, change-les si besoin.
3. Enregistre `DISCORD_REDIRECT_URI` comme redirect URI valide sur le
   [portail développeur Discord](https://discord.com/developers/applications) (onglet OAuth2).
4. Lance toute la stack :

   ```bash
   docker compose up -d --build
   ```

   Ordre de démarrage : Postgres → Lavalink (plugins YouTube/LavaSrc téléchargés automatiquement -
   peut prendre une minute) → `migrate` (applique le schéma Prisma puis s'arrête) → bot/API/dashboard.

5. Rien à faire pour les commandes slash : à chaque démarrage, le conteneur `gaulia_bot` remplace
   toutes les commandes globales par celles du code (les anciennes disparaissent) et vide les
   commandes propres au serveur `DEV_GUILD_ID`, pour éviter les doublons.

6. Invite le bot avec les scopes `bot applications.commands` et au minimum les permissions :
   `Ban Members`, `Kick Members`, `Moderate Members`, `Manage Messages`, `Manage Guild` (requis pour
   créer des règles AutoMod natives), `Connect`/`Speak` (musique), `Send Messages`, `Embed Links`,
   `Use Application Commands`.

7. Ouvre `https://gauliabot.xyz` (via ton reverse proxy), connecte-toi avec Discord et gère tes
   serveurs. Si ton compte figure dans `OWNER_IDS`, un lien **Admin** apparaît dans la nav (voir
   [Panel admin](#panel-admin)).

## Démarrage sans Docker (dev)

```bash
npm install
npm run prisma:migrate      # applique le schéma sur ta base Postgres locale
npm run dev:bot              # bot, process unique (pas de sharding), rechargement automatique
npm run dev:api               # API Fastify sur le port 4000 (interne, cf. apps/api/package.json)
npm run dev:dashboard          # dashboard Next.js sur le port 3000 (interne, cf. apps/dashboard/package.json)
```

Lance Postgres et Lavalink toi-même (ou seulement ces deux services via
`docker compose up -d postgres lavalink`) et adapte dans `.env` : `DATABASE_URL`/`LAVALINK_HOST`
vers `localhost`, `DISCORD_REDIRECT_URI`/`DASHBOARD_URL`/`NEXT_PUBLIC_API_URL` vers
`http://localhost:4000`/`http://localhost:3000`, et `NODE_ENV=development` (sinon les cookies de
session sont marqués `Secure` et ne fonctionnent pas en HTTP local). Le `.env` versionné dans ce
dépôt est configuré pour la prod (domaine réel) - garde une copie locale séparée si tu jongles
entre les deux.

## Scripts utiles (racine du monorepo)

| Commande                                        | Description                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev:bot` / `dev:api` / `dev:dashboard` | Lance une app en dev avec rechargement automatique                                     |
| `npm run build`                                 | Build `packages/database` → `apps/bot` → `apps/api` → `apps/dashboard`, dans cet ordre |
| `npm run typecheck` / `lint`                    | Sur tous les workspaces                                                                |
| `npm run i18n:check`                            | Vérifie les clés de traduction utilisées dans le code                                  |
| `npm run deploy` / `deploy:guild`               | Déploiement manuel des commandes (global / serveur de dev), inutile avec Docker        |
| `npm run prisma:migrate`                        | Crée/applique une migration Prisma en dev                                              |
| `npm run prisma:studio`                         | Ouvre Prisma Studio pour explorer la base                                              |

Chaque workspace a aussi ses propres scripts (`npm run build -w apps/bot`, etc.) si tu veux cibler
une seule app.

## Configurer le serveur Lavalink

Le service `lavalink` du `docker-compose.yml` utilise l'image officielle
`ghcr.io/lavalink-devs/lavalink:4` avec la config `docker/lavalink/application.yml`.

### Plugins déjà configurés

- **[youtube-source](https://github.com/lavalink-devs/youtube-source)** - restaure la lecture
  YouTube (retirée du core Lavalink v4 pour raisons légales). Configuré avec plusieurs "clients"
  (`MUSIC`, `ANDROID_VR`, `WEB`, `WEBEMBEDDED`) pour limiter les blocages/rate-limits YouTube.
- **[LavaSrc](https://github.com/topi314/LavaSrc)** - résout les liens/recherches Spotify (et
  Deezer/Apple Music si tu les actives) vers des pistes jouables via YouTube.

Les deux sont téléchargés automatiquement au démarrage du conteneur (section `lavalink.plugins` de
`application.yml`) - aucune image custom à builder.

### Activer la résolution Spotify (optionnel)

1. Crée une app sur le [dashboard développeur Spotify](https://developer.spotify.com/dashboard).
2. Renseigne `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET` dans `.env`.
3. Redémarre le service Lavalink : `docker compose up -d lavalink`.

Sans ces identifiants, les liens Spotify ne seront simplement pas résolus (YouTube/SoundCloud
fonctionnent sans configuration additionnelle).

### Ajouter d'autres sources (Deezer, Apple Music, Yandex Music)

Dans `docker/lavalink/application.yml`, section `plugins.lavasrc.sources`, passe la source à `true`
et ajoute la config associée (voir la [doc LavaSrc](https://github.com/topi314/LavaSrc#readme) pour
les identifiants requis par source).

### Scaler avec plusieurs nodes Lavalink

`apps/bot/src/modules/music/services/musicManager.ts` initialise `LavalinkManager` avec un tableau
`nodes` - actuellement un seul node (`env.LAVALINK_HOST`/`LAVALINK_PORT`). Pour ajouter un second
node (par exemple un serveur dédié plus costaud, ou un node dans une autre région), ajoute une
entrée dans ce tableau avec un `id` différent ; lavalink-client répartit automatiquement les
nouveaux players entre les nodes disponibles (load balancing par charge).

### Sécurité

Le service Lavalink n'expose **aucun port sur l'hôte** par défaut dans `docker-compose.yml` - seul
le service `bot` peut le joindre, via le réseau Docker interne. Ne décommente `ports: - "2333:2333"`
que si tu as besoin d'y accéder depuis l'extérieur du réseau Docker (auquel cas, assure-toi que
`LAVALINK_PASSWORD` est une valeur forte et unique).

### Mémoire (JVM)

Le service `lavalink` fixe `_JAVA_OPTIONS: "-Xmx1g -Xms512m"` dans `docker-compose.yml` pour éviter
qu'il ne consomme toute la RAM d'un petit VPS. Augmente `-Xmx` si tu sers beaucoup de serveurs en
simultané (playback saccadé/`OutOfMemoryError` dans les logs = signal qu'il faut monter ce plafond).

## Gaulia Premium (SKUs & entitlements)

1. Dans le [portail développeur Discord](https://discord.com/developers/applications) → ton
   application → onglet **Monetization**, crée un SKU d'abonnement pour serveur (server
   subscription).
2. Copie son ID dans `PREMIUM_SKU_ID` (`.env`).
3. `apps/bot/src/modules/premium/services/entitlementService.ts` synchronise au démarrage la liste
   des entitlements actifs (`client.application.entitlements.fetch()`), puis la tient à jour en
   temps réel via les events gateway `entitlementCreate` / `entitlementUpdate` /
   `entitlementDelete`. Un cache Postgres (`premium_entitlements`) sert de filet de sécurité si
   l'appel REST échoue au redémarrage, et `Guild.premium`/`premiumExpiresAt` sont mis à jour en
   miroir pour que l'API (qui n'a pas accès à la mémoire du process du bot) puisse lire le statut.
4. `isPremiumGuild(guildId)` (même fichier) reste la seule source de vérité utilisée dans le code
   du **bot** pour gater une fonctionnalité en temps réel ; l'**API/dashboard** lisent la base
   directement (`GET /guilds/:guildId/premium`, via le helper `isPremiumActive`).

   Un serveur est premium s'il a **soit** un entitlement Discord actif (`Guild.premium`), **soit**
   du premium offert encore valide (`Guild.premiumGrantedUntil`, obtenu contre des crédits de vote -
   voir la section top.gg). Les deux colonnes sont indépendantes : l'expiration d'un abonnement
   Discord n'annule pas un premium offert, et inversement. Comme les octrois viennent du dashboard
   et non de la gateway, le bot relit la liste des serveurs concernés toutes les 60 s
   (`startPremiumGrantSync`, appelé depuis `events/ready.ts`) - un échange peut donc mettre jusqu'à
   une minute à débloquer une commande en jeu.
5. Pour gater une nouvelle commande côté bot : ajoute `premiumOnly: true` sur l'objet `Command` -
   le dispatcher (`apps/bot/src/events/interactionCreate.ts`) affiche automatiquement un message
   d'upsell avec un bouton d'achat natif Discord (`ButtonBuilder` + `ButtonStyle.Premium`) si le
   serveur n'a pas l'abonnement.

Fonctionnalités premium actuelles : mode 24/7 (`/247`), filtres audio (`/filters`), file d'attente
étendue (1000 titres au lieu de 100).

Pour tester sans payer : Discord permet de créer des **entitlements de test** gratuits pour ton
serveur de dev depuis le portail développeur (onglet Monetization de ton app → Test entitlements).

## top.gg (statistiques, votes et crédits)

Deux intégrations distinctes, chacune avec sa propre clé, toutes deux facultatives : sans clé,
la fonctionnalité correspondante est simplement inactive et le reste du bot tourne normalement.

### Publier le nombre de serveurs

1. Sur la page de ton bot sur top.gg → **Integrations & API**, génère une clé d'API et place-la
   dans `TOPGG_API_KEY` (`.env`).
2. `apps/bot/src/core/topgg/topggService.ts` publie `server_count` et `shard_count` sur
   `PATCH https://top.gg/api/v1/projects/@me/metrics` (API v1 : la clé s'envoie en
   `Authorization: Bearer <clé>` et le projet est déduit de la clé, aucun ID à passer).
3. L'envoi est piloté par le **process parent** du sharding (`apps/bot/src/index.ts`), une minute
   après le spawn puis toutes les 30 minutes : `client.guilds.cache` d'un shard ne connaît que ses
   propres serveurs, le total réel s'obtient avec `manager.fetchClientValues("guilds.cache.size")`.
   Un échec côté top.gg est loggé et retenté au tour suivant, jamais propagé au bot.

### Recevoir les votes et créditer les votants

1. Toujours dans **Integrations & API** → section **Webhooks**, déclare l'URL
   `https://api.<ton-domaine>/topgg/webhook` et copie le secret dans `TOPGG_WEBHOOK_SECRET`.
2. `apps/api/src/routes/topgg.routes.ts` vérifie chaque livraison avant tout traitement :
   l'en-tête `x-topgg-signature` (`t=<timestamp>,v1=<hmac>`) doit correspondre au HMAC-SHA256 de
   `<timestamp>.<corps brut>` calculé avec le secret, et l'horodatage doit tomber dans une fenêtre
   de 30 s (anti-rejeu) - voir `apps/api/src/topgg/webhookSignature.ts`. La route conserve le corps
   **brut** (parseur `application/json` encapsulé à ce scope) : re-sérialiser le JSON invaliderait
   la signature. Sans `TOPGG_WEBHOOK_SECRET`, l'endpoint répond `503` plutôt que de créditer sur la
   foi d'une requête non vérifiée.
3. Un événement `vote.create` valide crédite **10 crédits** (`CREDITS_PER_VOTE`) au compte du
   votant, identifié par `user.platform_id` (son ID Discord, donc le même compte que sur le
   dashboard). L'id du vote est stocké dans `topgg_votes` : top.gg réessayant une livraison tant
   qu'elle n'a pas abouti, cette table garantit qu'un même vote ne crédite qu'une fois.

### Crédits et premium offert

- L'utilisateur voit son solde partout sur le dashboard (badge de la barre de navigation) et le
  détail sur « Mes serveurs » : total gagné, nombre de votes, lien de vote et historique des
  mouvements (`GET /me/credits`).
- Dans l'onglet **Premium** d'un serveur qu'il gère, il échange ses crédits contre du premium
  offert : **150 crédits pour une semaine**, **500 pour un mois** (`POST
  /guilds/:guildId/premium/redeem`). Les offres sont définies au même endroit pour l'API et le
  dashboard, dans `apps/api/src/premium/offers.ts`.
- L'échange débite d'abord (`spendCredits`, dont le `updateMany` conditionné sur
  `balance >= montant` empêche deux échanges simultanés de passer le solde en négatif), puis
  prolonge `Guild.premiumGrantedUntil` - en repartant de l'échéance en cours si elle est encore
  valide, pour que deux échanges se cumulent. Si l'octroi échoue après le débit, les crédits sont
  recrédités.
- Chaque mouvement (vote, échange, ajustement admin) est journalisé dans `credit_transactions`
  avec le solde résultant, l'auteur d'un ajustement et le serveur concerné par un échange.
- Le compte de crédits et l'historique de votes d'un utilisateur partent avec ses données lors
  d'une suppression RGPD (onglet **Données** du panel admin).

### Source du premium et remboursement au prorata

Un serveur peut être premium de deux façons - l'abonnement Discord payant (entitlement) ou des
crédits échangés - et l'onglet **Premium** du dashboard dit toujours laquelle, avec sa date.

- `describePremium()` (`packages/database/src/repositories/premium.repo.ts`) détaille le statut
  source par source : c'est ce que renvoie `GET /guilds/:guildId/premium`. Quand les deux
  coexistent, l'abonnement payant prime à l'affichage - il ne s'interrompt pas, lui.
- L'abonnement affiche son **prochain renouvellement** (`premiumExpiresAt`), le premium offert son
  **expiration** (`premiumGrantedUntil`), sans renouvellement automatique.
- **Souscrire un abonnement pendant une période offerte reconvertit le reste en crédits.**
  `refundUnusedGrantedPremium()` est appelée à la création d'un entitlement
  (`handleEntitlementCreate`, côté bot) : elle rembourse chaque contributeur au prorata du temps
  restant (il reste la moitié de la fenêtre → la moitié de sa mise revient), referme la fenêtre
  dans la même transaction, et journalise un mouvement `PREMIUM_REFUND`. Sans cela les deux
  premiums brûleraient en parallèle et les crédits seraient perdus.
- `Guild.premiumGrantedAt` marque le début de la fenêtre en cours : deux échanges successifs la
  prolongent sans en changer le début, donc la période reste remboursable d'un bloc. Un octroi posé
  à la main depuis le panel admin n'a pas de date de début ni de crédits dépensés : il n'est jamais
  remboursé ni refermé.
- La conversion est déclenchée par la **création** d'un entitlement uniquement, jamais par une mise
  à jour ni par la resynchronisation du démarrage - sinon un octroi manuel disparaîtrait au
  prochain redémarrage du bot. Refermer la fenêtre rend l'opération idempotente.
- L'API refuse un échange de crédits sur un serveur déjà abonné : ils seraient consommés en
  parallèle sans rien apporter. Le dashboard désactive les offres et l'explique.

## Commande `/botinfo`

Fiche complète du bot, en quatre onglets navigables aux boutons Components V2 (`apercu`,
`technique`, `shards`, `commandes`), utilisable en serveur comme en message privé.
`/botinfo vue:<onglet>` ouvre directement l'onglet voulu.

- **D'où viennent les chiffres** : un process de shard ne connaît que SES serveurs
  (`client.guilds.cache` est scopé au shard), donc tous les totaux globaux sont recalculés depuis
  les heartbeats en base - exactement la source du `GET /admin/stats` de l'API. Le reste (mémoire,
  versions, cache, latence WebSocket) décrit le process qui répond, et l'onglet **Shards** montre
  les deux à la fois, le shard courant étant marqué `➤`.
- **Ce qui vient de la base** : `getBotContentStats()`
  (`packages/database/src/repositories/botStats.repo.ts`) ne renvoie que deux totaux (serveurs
  premium, aventuriers) et `measureDatabaseLatency()` mesure un aller-retour Postgres. La commande
  est publique : aucun détail par serveur ou par membre n'y transite.
- **Catalogue** : compté à chaud depuis `client.commands` / `client.components`, donc toujours à
  jour sans rien déclarer.
- **Rien n'est gardé « depuis toujours »** : l'onglet Commandes affiche le jour courant, 30 jours
  et 90 jours, cette dernière fenêtre étant `COMMAND_USAGE_RETENTION_DAYS` - la durée de
  conservation appliquée par le job de rétention de l'API. Le total est recalculé sur la fenêtre
  plutôt que lu dans `totalAllTime`, pour rester juste même entre deux purges.
- **Où c'est rangé** : `modules/general/services/botinfo/` (collecte dans `botStatsService.ts`,
  vues dans `botinfoUi.ts`), la commande dans `commands/botinfo.ts` et les deux boutons dans
  `components/botinfo.ts`. Ajouter un onglet = ajouter une entrée à `BOT_INFO_VIEWS` et sa
  fonction de rendu ; le composant `botinfo:vue` sait déjà l'afficher.
- Le message est public mais les boutons appartiennent à celui qui a lancé la commande : un autre
  membre qui clique reçoit un message éphémère l'invitant à lancer son propre `/botinfo`.
- Le bouton **Ajouter Gaulia** est construit par `botInviteUrl()` (`client/Constants.ts`), qui
  porte les scopes `bot` **et** `applications.commands` (sans le second, Discord répond « no scope
  were provided ») et le jeu de permissions minimal de chaque module.

## Module aventure

Un jeu de rôle textuel au long cours, greffé sur le bot. Un joueur = **un aventurier unique**,
partagé entre tous les serveurs et les messages privés (la progression n'est pas par serveur :
seuls les salons où l'on peut jouer se règlent par serveur).

- **Boucle de jeu** : `/aventure explorer` consomme de l'énergie et tire une rencontre dans la
  région courante - combat résolu d'un bloc, trouvaille, ou simple ambiance. Tout le reste
  (expérience, butin, quêtes, chapitre, hauts faits) découle d'évènements de jeu passés à
  `services/events/eventDispatcher.ts`. Ajouter une action revient à émettre les bons évènements :
  elle n'a rien à savoir des quêtes ni du scénario.
- **Tutoriel intégré** : `/aventure tuto` explique le jeu en sept pages qu'on feuillette aux
  boutons (bases, progression, économie, scénario, échanges, vie entre joueurs, rythme), avec un
  menu pour sauter à un chapitre et l'option `sujet:` pour y arriver directement. C'est la seule
  commande du module qui ne demande pas d'aventurier : tant qu'on n'en a pas, la page propose de
  créer le sien d'un bouton par classe. Le contenu vit dans `data/tutorial.ts` et lit les chiffres
  dans l'équilibrage - régler le jeu met le tutoriel à jour tout seul.
- **Tout se joue au bouton** : chaque écran porte sa barre de navigation (Components V2) et ses
  actions - voyager depuis la carte, explorer de nouveau, se soigner quand on est amoché, lancer le
  donjon, renforcer une pièce, acheter, équiper, accepter un échange. Les commandes restent
  disponibles pour qui préfère taper.
  Côté code, une seule vue existe par écran : `ui/renderView.ts` les rend toutes, et le composant
  `adventure:nav:<joueur>:<vue>` sait afficher n'importe laquelle. Rendre une vue navigable ne
  demande donc qu'une entrée dans `AdventureView` (`ui/navigation.ts`), sans nouveau composant.
  Chaque identifiant porte son propriétaire : un membre ne peut pas cliquer sur le message d'un
  autre.
- **Progression** : 100 niveaux, trois classes (guerrier, mage, rôdeur), points de caractéristique
  à répartir, équipement en trois emplacements, forge, boutique, donjon hebdomadaire, quêtes
  quotidiennes et hebdomadaires validées automatiquement, série de jours consécutifs, hauts faits
  et titres, classement global.
- **Renforcement** (`/aventure renforcer`) : chaque pièce d'équipement se monte jusqu'à **+10**
  contre de l'or et des matériaux, de plus en plus rares selon la rareté de la pièce (lingots →
  écailles de drake → cœurs élémentaires → éclats d'écho). Chaque palier ajoute 12 % aux bonus de
  la pièce. Coût déterministe, aucune loterie de destruction. C'est le débouché des matériaux de
  haut niveau. Le renforcement est attaché à **l'exemplaire du joueur** : il ne suit pas l'objet
  lors d'un échange ou d'une revente, ce qui évite un marché de pièces déjà montées.
- **Échanges entre joueurs** (`/aventure echange proposer`) : un aventurier propose objets et/ou pièces,
  demande objets et/ou pièces en retour, et l'autre accepte d'un bouton. Rien n'est prélevé à la
  proposition : les deux sacs sont revérifiés à l'acceptation, et le transfert se fait dans une
  seule transaction. Une proposition expire au bout de 15 minutes, chacun en a 5 ouvertes au
  maximum, et les échanges s'ouvrent au niveau 5. **Tout n'est pas échangeable** : le catalogue
  porte un indicateur `tradable`, faux pour les reliques du scénario - il suffit de le poser sur
  un objet pour le rendre incessible. Les sous-commandes d'échange sont regroupées sous
  `/aventure echange …` : Discord plafonne une commande à 25 options de premier niveau, et les
  groupes laissent la place aux prochaines mécaniques.
- **Scénario** : 7 actes × 5 chapitres. Un chapitre se termine quand ses objectifs sont remplis,
  que le niveau requis est atteint, puis qu'il est **scellé** avec des *fragments d'écho*.
- **Durée de vie** : les fragments ne s'obtiennent qu'en temps réel (lot quotidien, lot
  hebdomadaire, donjon de la semaine, trouvailles rares) - environ 14 par semaine au mieux, pour un
  scénario qui en coûte 755. Terminer l'histoire demande donc **au moins un an**, sans grind : la
  régularité compte, pas le nombre d'heures d'affilée. `npm run adventure:pacing -w packages/database`
  rejoue la simulation pour vérifier ce rythme après chaque retouche d'équilibrage.
- **Où l'on peut jouer** : toujours en message privé avec Gaulia ; sur un serveur, l'onglet
  **Aventure** du dashboard choisit entre liste blanche (par défaut, vide → interdit partout) et
  liste noire (autorisé partout sauf…). La règle s'applique à tout le monde, administrateurs
  compris.
- **Où vit quoi** : le contenu propre au jeu (zones, bestiaire, recettes, hauts faits, classes) est
  dans `apps/bot/src/modules/adventure/data/` ; le catalogue d'objets, le scénario, les quêtes,
  l'équilibrage et les coûts de renforcement sont dans `packages/database/src/data/adventure*.ts`,
  parce que l'API et le panel admin en ont besoin pour nommer un inventaire, afficher un
  avancement et offrir de l'expérience exactement comme le jeu la distribue.

## Le dashboard et l'API

**Périmètre v1** : consultation/édition de la configuration (salons de logs, automod, historique de
modération/warns, statut premium). Pas de pilotage temps réel du bot (pas de skip musique ou
kick/ban depuis le web) - ces actions restent des commandes Discord pour l'instant.

**Connexion (OAuth2 Discord)**, entièrement gérée par l'API (`apps/api/src/routes/auth.routes.ts`) :

1. `GET /auth/login` redirige vers Discord (scopes `identify guilds`).
2. `GET /auth/callback` échange le code, récupère l'utilisateur et ses serveurs (avec permissions),
   calcule ceux où l'utilisateur a `MANAGE_GUILD`/est owner, puis pose un cookie de session `httpOnly`
   (JWT, 12h) et redirige vers `${DASHBOARD_URL}/dashboard`.
3. Chaque route protégée vérifie ce JWT puis que le `guildId` demandé fait partie des serveurs
   gérables - sans nouvel appel à l'API Discord par requête.
4. `GET /guilds` croise cette liste avec les serveurs où **le bot est réellement présent**
   (`Guild.botPresent`, mis à jour par `guildCreate`/`guildDelete`/sync au `ready`).

**Liens publics et pied de page** : le pied de page (`components/SiteFooter.tsx`, monté une fois
dans `app/layout.tsx`) est commun à toutes les pages - présentation du bot, version, auteur, liens
vers Discord et mentions légales. Les liens sortants passent par des redirections construites au
build (`apps/dashboard/next.config.js`) plutôt que par des URL écrites en dur : `/invite` (ajout du
bot), `/vote` (page top.gg) et `/app-directory` (fiche Discord App Directory) viennent de
`DISCORD_CLIENT_ID`, et `/support` du code d'invitation `DISCORD_SUPPORT_INVITE_CODE` (ce qui suit
`discord.gg/`). Sans ces variables, les redirections ne sont pas créées : les trois premiers liens
renvoient un 404 plutôt que de pointer vers un mauvais bot, et le lien de support disparaît
simplement du pied de page. La version affichée est lue au build dans le
`package.json` de la racine, et l'adresse de contact reste facultative
(`NEXT_PUBLIC_CONTACT_EMAIL` vide = lien masqué, comme sur la page de confidentialité).

**Page de contact** (`/contact`) : formulaire **réservé aux comptes Discord connectés**, envoyé à
`POST /contact` (API), qui transmet le message par mail à `CONTACT_EMAIL_TO` via SMTP
(`apps/api/src/mail/`). L'identité (pseudo, identifiant, avatar, adresse vérifiée) vient de la
session, jamais de champs saisis : personne ne peut écrire au nom d'un autre, et il n'y a pas
d'adresse fantaisiste à qui répondre. La connexion OAuth2 demande donc le scope `email` en plus
d'`identify` et `guilds`, et `GET /auth/login?redirect=/contact` ramène le visiteur sur la page
d'où il est parti (seul un chemin interne est accepté, sinon le dashboard deviendrait un tremplin
de redirection). Une session ouverte avant ce scope, ou un compte sans adresse vérifiée, reçoit un
403 qui invite à se reconnecter. Le rendu HTML du mail
reprend la palette du site (dégradé indigo → violet, thème clair) en HTML de mail (tableaux et
styles en ligne) avec une version texte en parallèle et un `Reply-To` sur l'auteur du message,
pour répondre d'un simple « Répondre ». Rien n'est stocké en base : le message vit dans la boîte
mail. Deux quotas en mémoire freinent les envois répétés : 3 messages par compte
toutes les 15 minutes, 40 par heure tous comptes confondus. Le serveur concerné, facultatif, est
un menu déroulant alimenté par `GET /guilds` : d'abord ceux où Gaulia tourne, puis les autres en
grisé. Le menu n'est qu'un confort de saisie - l'API revérifie avec `hasGuildAccess` que le compte
gère bien le serveur envoyé, et résout son nom depuis la session pour que le mail soit lisible.
Tant que `SMTP_HOST` ou l'adresse de contact est vide, la route répond 503 et le formulaire
l'annonce.

Côté SMTP, `secure` se déduit du **port** et non d'une variable : le 465 ouvre une connexion
chiffrée d'emblée, tandis que le 587 démarre en clair et bascule via STARTTLS. Annoncer
`secure: true` sur le 587 ferait attendre une poignée de main que le serveur n'entame jamais.
`SMTP_TLS` (vrai par défaut) sert donc à *exiger* le chiffrement (`requireTLS`) : un serveur qui
ne propose pas STARTTLS fait échouer l'envoi au lieu de l'expédier en clair. Des délais d'attente
explicites (connexion, accueil, socket) évitent qu'un serveur muet laisse la requête HTTP pendue
plusieurs minutes. `SMTP_FROM` et `CONTACT_EMAIL_TO` sont facultatifs : à défaut, tous deux
reprennent `NEXT_PUBLIC_CONTACT_EMAIL`, donc le formulaire s'envoie à l'adresse de contact
publique depuis cette même adresse (un domaine déjà vérifié chez le fournisseur, donc
délivrable), le `Reply-To` portant toujours l'auteur du message.

**Ajouter un nouveau réglage éditable** : ajoute le champ au schéma Prisma
(`packages/database/prisma/schema.prisma`), régénère (`npm run prisma:generate` puis une migration),
expose-le en lecture/écriture dans la route API concernée (`apps/api/src/routes/*.routes.ts`, avec
validation `zod`), puis ajoute le champ dans la page dashboard correspondante
(`apps/dashboard/src/app/dashboard/[guildId]/*/page.tsx`).

## Panel admin

Un panel séparé (`/admin` sur le dashboard) réservé aux **propriétaires du bot**, distinct du
dashboard par-serveur : accès basé sur `OWNER_IDS` (`.env`), pas sur les permissions Discord d'un
serveur particulier.

- Au login, l'API calcule `isOwner = OWNER_IDS.includes(userId)` et le signe dans le JWT de session
  (`apps/api/src/routes/auth.routes.ts`) - aucune route n'a besoin de relire `.env` à chaque requête.
- Toutes les routes `/admin/*` (`apps/api/src/routes/admin.routes.ts`) exigent `isOwner` via le
  preHandler `requireOwner` - un utilisateur normal reçoit `403` même en devinant l'URL.
- Un propriétaire peut aussi consulter/modifier la config de **n'importe quel serveur** via les
  routes `/guilds/:guildId/...` normales (`hasGuildAccess` bypass la vérification MANAGE_GUILD si
  `isOwner` est vrai) - pratique pour du support sans avoir besoin d'être membre du serveur.
- Fonctionnalités actuelles : statistiques détaillées (`GET /admin/stats`), liste de **tous** les serveurs connus
  du bot avec leur nom (synchronisé par `apps/bot/src/events/{guildCreate,guildUpdate}.ts` et
  `core/presence/guildPresenceSync.ts` - utile car un owner n'est pas forcément membre de chaque
  serveur), un bouton pour offrir/retirer manuellement le premium à un serveur
  (`PATCH /admin/guilds/:guildId/premium`, sans passer par un vrai achat Discord - pratique pour du
  support ou des essais), et l'onglet **Crédits**.
- Onglet **Crédits** (`/admin/credits`) : liste des utilisateurs possédant des crédits (pseudo,
  identifiant, solde, nombre de votes, dernier vote) avec deux façons d'écrire un solde, toutes
  deux confirmées avant enregistrement - la boîte de dialogue « Ajouter / retirer des crédits »
  (identifiant Discord + variation ±, motif facultatif ; le compte est créé s'il n'existe pas) et
  l'édition directe de la cellule d'une ligne. Les deux passent par
  `PATCH /admin/credits/:userId` (`delta` ou `balance`), qui journalise systématiquement un
  mouvement `ADMIN_ADJUST` avec l'auteur, jamais une valeur absolue.
- Onglet **Aventure** (`/admin/adventure`) : liste de tous les aventuriers (classe, niveau, acte et
  chapitre atteints, bourse, fragments, dernière partie), fiche complète d'un joueur (progression,
  caractéristiques, inventaire avec le palier de renforcement de chaque pièce, quêtes en cours,
  échanges en attente, journal) et interventions dans sa partie -
  expérience, pièces, fragments d'écho, énergie, points de caractéristique, niveau et objets
  donnés ou retirés (`PATCH /admin/adventure/players/:userId`). L'expérience offerte passe par la
  même règle que le jeu (les niveaux montent normalement), et **chaque intervention est inscrite
  dans le journal du joueur**, visible par lui avec `/aventure journal`.
- Le dashboard (`apps/dashboard/src/app/admin/`) réutilise le même login que le reste - pas de
  système d'auth séparé à maintenir.

**⚠️ Important** : `OWNER_IDS` doit être un ID Discord numérique (le tien), pas un pseudo. Récupère-le
via le mode développeur Discord (clic droit sur ton profil → "Copier l'ID"). Plusieurs IDs possibles,
séparés par des virgules.

## Domaine & ports

Pas de reverse proxy dans ce `docker-compose.yml` - tu as déjà le tien en amont. Voici quel domaine
pointer vers quel port sur cette machine :

| Domaine             | Port hôte | Service     | Notes                                            |
| ------------------- | --------- | ----------- | ------------------------------------------------ |
| `gauliabot.xyz`     | `4500`    | `dashboard` | Next.js - sert le panel serveur + le panel admin |
| `api.gauliabot.xyz` | `4501`    | `api`       | Fastify - OAuth2, config, stats                  |

Ton reverse proxy doit terminer le TLS et forwarder en HTTP simple vers `<ip-de-cette-machine>:4500`
et `:4501` (ces deux ports sont déjà choisis hors des plages courantes 3000/3001/8000/9000). Aucun
autre port n'a besoin d'être exposé : Postgres et Lavalink restent uniquement accessibles sur le
réseau Docker interne.

Si tu ajoutes un service public supplémentaire plus tard (ex: un futur endpoint de stats), donne-lui
un port du même bloc (`4502`, `4503`, …) dans `docker-compose.yml`, et ajoute la règle correspondante
côté ton reverse proxy.

## Vérification

```bash
npm run typecheck
npm run lint
npm run i18n:check
```

Puis en conditions réelles : `docker compose up -d --build`, et sur ton
serveur de test : `/ping`, `/warn`, `/automod setup`, `/play`, `/premium status`, puis le login
Discord complet via ton reverse proxy (et le lien **Admin** si ton compte est dans `OWNER_IDS`).

## Déploiement automatique (timer systemd)

Le dossier `deploy/` fournit un déploiement continu sans port exposé : un timer systemd vérifie chaque
minute s'il y a un nouveau commit sur la branche du dossier (`main` en production, `dev` pour
l'instance de test), et si oui :

1. `git reset --hard origin/<branche>` puis `git clean -fd` (le `.env`, ignoré par git, est conservé) ;
2. `docker compose up -d --build --remove-orphans` : les images sont construites pendant que les
   anciens conteneurs tournent, seuls les services modifiés sont recréés, et le service `migrate`
   applique les nouvelles migrations ;
3. nettoyage des anciennes images et du cache de build de plus de 7 jours.

Les données Postgres sont dans un volume nommé (`gaulia_bot_gaulia_postgres_data`) qui n'est jamais
supprimé. N'utilise jamais `docker compose down -v`.

Installation (une fois, à la racine du dépôt cloné sur le serveur, avec le `.env` en place) :

```bash
sudo bash deploy/install.sh
```

Commandes utiles :

| Action                                     | Commande                                        |
| ------------------------------------------ | ----------------------------------------------- |
| Suivre les déploiements                    | `journalctl -u gaulia-deploy.service -f`        |
| État du timer (prochaine vérification)     | `systemctl list-timers gaulia-deploy.timer`     |
| Forcer un redéploiement                    | `bash deploy/deploy.sh --force`                 |
| Suspendre / reprendre le déploiement auto  | `sudo systemctl stop/start gaulia-deploy.timer` |

Un commit dont le build échoue n'est pas retenté en boucle : les anciens conteneurs continuent de
tourner, l'échec apparaît dans `journalctl`, et le commit suivant (ou `--force`) relance un
déploiement. Si `deploy/gaulia-deploy.service` ou `.timer` change, relance `sudo bash deploy/install.sh`.

### Instance de test (branche `dev`)

Une seconde instance tourne sur la même machine pour tester sans toucher au bot principal : autre
dossier, autre branche, autre `.env`, donc autres conteneurs, autre base de données et autre bot
Discord. Pousser sur `dev` met à jour le test ; merger `dev` dans `main` déploie la production.

|                     | Production                            | Test                                        |
| ------------------- | ------------------------------------- | ------------------------------------------- |
| Dossier / branche   | `~/gaulia_bot` / `main`               | `~/gaulia_test` / `dev`                     |
| Domaines            | `gauliabot.xyz`, `api.gauliabot.xyz`  | `gtest.noam.ovh`, `api-gtest.noam.ovh`      |
| Ports publics       | `4500`, `4501`                        | `4510`, `4511`                              |
| `.env` (instance)   | valeurs par défaut                    | `COMPOSE_PROJECT_NAME=gaulia_test`, `CONTAINER_PREFIX=gaulia_test`, `DASHBOARD_HOST_PORT=4510`, `API_HOST_PORT=4511` |
| Unités systemd      | `gaulia-deploy`                       | `gaulia-test-deploy`                        |

L'instance de test utilise sa propre application Discord (token, client id, secret et redirect URI
`https://api-gtest.noam.ovh/auth/callback`) : avec le même token, les deux bots répondraient et
écraseraient mutuellement leurs commandes. Laisse `TOPGG_API_KEY` et `TOPGG_WEBHOOK_SECRET` vides sur
le test : la clé top.gg est liée au bot de production. `deploy.sh` et `install.sh` refusent de
déployer une autre branche que `main` tant que `COMPOSE_PROJECT_NAME` n'est pas défini (et différent
de `gaulia_bot`).

```bash
git clone -b dev https://github.com/noamroger/gaulia_bot.git ~/gaulia_test
cd ~/gaulia_test && cp .env.example .env   # puis remplir le .env de test
sudo bash deploy/install.sh gaulia-test-deploy
journalctl -u gaulia-test-deploy.service -f
```
