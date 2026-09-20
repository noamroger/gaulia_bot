import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Gaulia",
  description: "Comment Gaulia collecte, utilise et conserve les données.",
};

const LAST_UPDATED = "20 septembre 2026";

function Contact() {
  return CONTACT_EMAIL ? (
    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
  ) : (
    <span>l&apos;équipe Gaulia</span>
  );
}

export default function PrivacyPage() {
  return (
    <div className="container">
      <p>
        <Link href="/dashboard" className="text-muted">
          ← Retour au dashboard
        </Link>
      </p>

      <article className="legal">
        <h1>Politique de confidentialité</h1>
        <p className="text-muted">Dernière mise à jour : {LAST_UPDATED}</p>

        <p>
          Cette page explique quelles données le bot Discord Gaulia et son tableau de bord web
          traitent, pourquoi, combien de temps elles sont gardées et comment en demander la
          suppression. Elle décrit le fonctionnement réel du service, sans formule générique.
        </p>

        <h2>1. En bref</h2>
        <ul>
          <li>Nous ne vendons aucune donnée et n&apos;affichons aucune publicité.</li>
          <li>Nous n&apos;enregistrons jamais le contenu de vos messages.</li>
          <li>
            Les statistiques d&apos;utilisation sont anonymes (aucun identifiant d&apos;utilisateur
            ni de serveur) et supprimées automatiquement au bout de 90 jours.
          </li>
          <li>
            Le tableau de bord n&apos;utilise aucun outil de mesure d&apos;audience ni cookie
            publicitaire.
          </li>
          <li>
            Vous pouvez à tout moment consulter, télécharger et supprimer vos données vous-même
            depuis la page <Link href="/my-data">Mes données</Link>, en vous connectant avec Discord
            — et y supprimer aussi les données des serveurs que vous administrez.
          </li>
        </ul>

        <h2>2. Données traitées par le bot</h2>

        <h3>Configuration des serveurs</h3>
        <p>
          Pour chaque serveur où Gaulia est ajouté : identifiant, nom, icône et nombre de membres du
          serveur, langue, salons et rôles choisis dans la configuration (salons de logs, rôle DJ,
          salon musique, salons autorisés pour les commandes fun), et statut premium. Ces données
          servent au fonctionnement du bot et à l&apos;affichage dans le tableau de bord.
        </p>

        <h3>Modération</h3>
        <p>
          Quand un modérateur utilise les commandes de sanction (bannissement, expulsion, sourdine,
          avertissement, purge…), Gaulia enregistre l&apos;identifiant et le pseudo de la personne
          sanctionnée et du modérateur, le type de sanction, la raison indiquée, la durée éventuelle
          et la date. Cet historique est consultable par les modérateurs du serveur via les
          commandes du bot, et un résumé de chaque sanction peut être publié dans le salon de logs
          choisi par le serveur. Les réglages de modération du serveur (message privé au membre
          sanctionné, sanctions automatiques après un nombre d&apos;avertissements) sont aussi
          enregistrés.
        </p>

        <h3>Automodération</h3>
        <p>
          Gaulia enregistre la configuration de l&apos;automod (règles activées, listes de domaines,
          d&apos;invitations et de mots interdits, sanctions choisies, salons et rôles ignorés).
          Pour détecter le spam, le bot garde temporairement en mémoire vive le dernier message et
          l&apos;heure des messages récents de chaque membre. Ces informations ne sont jamais
          écrites sur disque ni en base de données, et disparaissent au redémarrage du bot. Quand
          une règle est enfreinte, le message est supprimé, la sanction choisie par le serveur est
          appliquée (et enregistrée dans l&apos;historique de modération), et un avis (pseudo de
          l&apos;auteur, salon, type d&apos;infraction et sanction, sans le contenu du message) peut
          être publié dans le salon de logs du serveur. Les règles d&apos;AutoMod natives de Discord
          sont appliquées par Discord lui-même.
        </p>

        <h3>Musique</h3>
        <p>
          Gaulia enregistre uniquement les réglages musique du serveur (volume et répétition par
          défaut, mode 24/7, salon dédié et rôle DJ). Vos recherches sont transmises à notre serveur
          audio pour trouver le morceau, puis à SoundCloud (et à Spotify quand vous partagez un lien
          Spotify). La file d&apos;attente, avec l&apos;identifiant et le pseudo de la personne qui
          a demandé chaque morceau, n&apos;existe qu&apos;en mémoire pendant la lecture et
          n&apos;est jamais enregistrée.
        </p>

        <h3>Jeux et divertissement</h3>
        <p>
          Les jeux du module fun (puissance 4, morpion, pendu, Wordle, blackjack) gardent
          l&apos;état de chaque partie en cours (identifiants des joueurs, grille, mot à trouver,
          propositions) uniquement en mémoire vive. Il disparaît à la fin de la partie, après 10
          minutes d&apos;inactivité ou au redémarrage du bot, et n&apos;est jamais enregistré. Le
          résultat de la commande lovecalc est calculé à partir des identifiants Discord des deux
          membres, sans rien conserver.
        </p>
        <p>
          Pendant un blindtest, Gaulia lit les messages envoyés dans le salon de la partie par les
          membres présents dans le salon vocal, uniquement pour les comparer à la réponse attendue :
          ils ne sont ni enregistrés ni conservés. Les scores (identifiants des joueurs et points)
          restent en mémoire vive et disparaissent à la fin de la partie. Les extraits joués sont
          les aperçus de 30 secondes fournis publiquement par Spotify, rejoués par notre serveur
          audio (ou retrouvés sur SoundCloud à défaut) : aucune donnée vous concernant n&apos;est
          transmise à Spotify.
        </p>
        <p>
          Les gestionnaires d&apos;un serveur peuvent créer des listes de musiques pour le blindtest
          depuis le tableau de bord. Nous enregistrons le nom de chaque liste et, pour chaque titre,
          son nom, son artiste, sa durée et ses liens Spotify, avec la configuration du serveur.
          Pour importer un lien Spotify, notre serveur lit la page publique correspondante chez
          Spotify, sans transmettre aucune donnée vous concernant. Ces listes sont supprimées avec
          les autres données du serveur.
        </p>

        <h3>Abonnement premium</h3>
        <p>
          Les abonnements Gaulia Premium sont vendus et gérés par Discord : nous ne voyons ni ne
          stockons aucune information de paiement. Nous gardons une copie des droits transmis par
          Discord (identifiant de l&apos;abonnement, offre, serveur ou utilisateur concerné, dates
          de début et de fin) pour activer les fonctionnalités premium.
        </p>

        <h3>Votes top.gg et crédits</h3>
        <p>
          Si vous votez pour Gaulia sur top.gg, top.gg nous transmet votre identifiant Discord,
          votre pseudo, l&apos;adresse de votre avatar et la date du vote. Nous enregistrons
          l&apos;identifiant de chaque vote (pour ne pas vous créditer deux fois pour le même vote),
          votre solde de crédits et l&apos;historique de vos mouvements de crédits (votes, échanges
          contre du premium offert, ajustements par un administrateur du bot). Ces données servent
          uniquement à faire fonctionner les crédits : elles sont visibles par vous sur le tableau
          de bord et par les propriétaires du bot dans leur panneau d&apos;administration. Elles
          sont conservées tant que votre compte de crédits existe, et supprimées sur demande. Nous
          ne recevons de top.gg aucune information de compte au-delà de ce qui est listé ici.
        </p>

        <h3>Statistiques</h3>
        <p>
          Pour suivre la santé du service, nous comptons le nombre d&apos;utilisations de chaque
          commande par jour, avec sa catégorie (modération, musique, fun…). Ces compteurs ne
          contiennent ni identifiant d&apos;utilisateur, ni identifiant de serveur, ni contenu : il
          est impossible de savoir qui a utilisé une commande. Ils sont supprimés automatiquement
          après 90 jours. Nous relevons aussi des indicateurs techniques globaux (nombre de
          serveurs, nombre total de membres, latence, mémoire utilisée), sans aucune donnée
          personnelle. Leur historique, par tranche de 10 minutes, est lui aussi supprimé
          automatiquement après 90 jours. Le nombre total de serveurs, de membres et de commandes
          utilisées sur les 30 derniers jours est affiché publiquement sur la page d&apos;accueil,
          sans aucun détail par serveur ni par utilisateur.
        </p>

        <h2>3. Données traitées par le tableau de bord</h2>
        <p>
          La connexion se fait avec votre compte Discord (autorisations « identify », « guilds » et
          « email »). Nous recevons votre identifiant, votre pseudo, votre avatar, l&apos;adresse
          vérifiée de votre compte et la liste des serveurs que vous pouvez gérer. Ces informations
          sont placées uniquement dans un cookie de session signé, et ne sont pas enregistrées en
          base de données. L&apos;adresse ne sert qu&apos;à vous répondre si vous écrivez depuis la
          page <Link href="/contact">Nous contacter</Link> : elle n&apos;est jamais ajoutée à une
          liste de diffusion. Le jeton d&apos;accès fourni par Discord sert une seule fois, pendant
          la connexion, puis n&apos;est pas conservé.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Cookie</th>
                <th>Rôle</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>gaulia_session</code>
                </td>
                <td>Garder votre session ouverte</td>
                <td>12 heures</td>
              </tr>
              <tr>
                <td>
                  <code>gaulia_oauth_state</code>
                </td>
                <td>Sécuriser la connexion avec Discord</td>
                <td>5 minutes</td>
              </tr>
              <tr>
                <td>
                  <code>gaulia_oauth_return</code>
                </td>
                <td>Revenir à la page d&apos;où vous vous êtes connecté</td>
                <td>5 minutes</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Ces cookies sont strictement nécessaires au fonctionnement du tableau de bord.</p>

        <h3>Formulaire de contact</h3>
        <p>
          La page <Link href="/contact">Nous contacter</Link> demande d&apos;être connecté avec
          Discord. Le message envoyé est accompagné de votre pseudo, de votre identifiant, de votre
          avatar et de l&apos;adresse vérifiée de votre compte, tous repris de votre session — rien
          n&apos;est saisi à la main, personne ne peut donc écrire en se faisant passer pour vous.
          L&apos;ensemble part par courrier électronique à l&apos;administrateur du bot. Rien
          n&apos;est enregistré en base de données : le message vit dans la boîte mail qui le
          reçoit, et votre adresse ne sert qu&apos;à vous répondre. Pour limiter les abus, le nombre
          d&apos;envois par compte est plafonné ; ces compteurs restent en mémoire et disparaissent
          au redémarrage.
        </p>

        <h2>4. Journaux techniques</h2>
        <p>
          Nos serveurs enregistrent des journaux techniques (requêtes reçues avec l&apos;adresse IP
          de connexion, identifiants de serveurs et erreurs) pour assurer la sécurité et corriger
          les problèmes. Ils ne servent à rien d&apos;autre et sont effacés automatiquement par
          rotation (50 Mo maximum par service).
        </p>

        <h2>5. Durées de conservation</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Données</th>
                <th>Conservation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Statistiques d&apos;utilisation et historique des indicateurs techniques
                  (anonymes)
                </td>
                <td>90 jours, puis suppression automatique</td>
              </tr>
              <tr>
                <td>Session du tableau de bord</td>
                <td>12 heures</td>
              </tr>
              <tr>
                <td>Mémoire anti-spam, file d&apos;attente musique et parties de jeu en cours</td>
                <td>Jusqu&apos;au redémarrage du bot, jamais enregistrées</td>
              </tr>
              <tr>
                <td>Messages envoyés depuis le formulaire de contact</td>
                <td>
                  Jamais enregistrés en base : conservés dans la boîte mail de l&apos;administrateur
                  le temps de traiter la demande
                </td>
              </tr>
              <tr>
                <td>Journaux techniques</td>
                <td>Rotation automatique (50 Mo maximum par service)</td>
              </tr>
              <tr>
                <td>Configuration, historique de modération, réglages</td>
                <td>Jusqu&apos;à une demande de suppression</td>
              </tr>
              <tr>
                <td>Droits premium</td>
                <td>Tant que l&apos;abonnement existe chez Discord</td>
              </tr>
              <tr>
                <td>Votes top.gg et crédits</td>
                <td>Jusqu&apos;à une demande de suppression</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Retirer Gaulia d&apos;un serveur arrête toute nouvelle collecte pour ce serveur. Les
          données déjà enregistrées sont conservées pour le cas où le bot serait ajouté à nouveau,
          jusqu&apos;à ce que vous en demandiez la suppression.
        </p>

        <h2>6. Partage des données</h2>
        <p>
          Vos données ne sont partagées qu&apos;avec les services nécessaires au fonctionnement :
        </p>
        <ul>
          <li>Discord, la plateforme sur laquelle fonctionne le bot ;</li>
          <li>SoundCloud et Spotify, uniquement pour les recherches musicales que vous lancez ;</li>
          <li>
            top.gg, si vous choisissez d&apos;y voter pour Gaulia : c&apos;est top.gg qui nous
            transmet votre vote, nous ne lui envoyons que le nombre de serveurs du bot ;
          </li>
          <li>
            l&apos;hébergeur du serveur sur lequel tournent le bot, l&apos;API et la base de
            données.
          </li>
        </ul>
        <p>Aucune donnée n&apos;est vendue, louée ou utilisée à des fins publicitaires.</p>

        <h2>7. Sécurité</h2>
        <p>
          La base de données n&apos;est accessible que depuis le réseau interne de nos serveurs. Le
          tableau de bord et l&apos;API sont servis en HTTPS. L&apos;administration du service est
          réservée aux propriétaires du bot.
        </p>

        <h2>8. Vos droits</h2>
        <p>
          Conformément au RGPD, vous pouvez accéder à vos données, en obtenir une copie et en
          demander la suppression. La page <Link href="/my-data">Mes données</Link> le fait
          directement, sans passer par nous : connectez-vous avec Discord, et vous y trouverez le
          détail de ce qui est enregistré sur votre compte, un téléchargement au format JSON et un
          bouton de suppression définitive. C&apos;est la connexion Discord qui prouve que le compte
          est le vôtre, donc personne d&apos;autre ne peut consulter ni effacer vos données.
        </p>
        <p>
          La même page permet aussi, si vous administrez un serveur (permission « Gérer le serveur »
          côté Discord), de supprimer les données de ce serveur.
        </p>
        <ul>
          <li>
            <strong>Suppression d&apos;un utilisateur</strong> : le compte de crédits et son
            historique, les votes top.gg enregistrés, les droits premium en cache et le personnage
            d&apos;aventure avec son inventaire et sa progression sont effacés.
          </li>
          <li>
            <strong>Suppression d&apos;un serveur</strong> : toutes ses données sont effacées
            (configuration, historique de modération, avertissements, automod, musique, listes de
            blindtest, réglages de l&apos;aventure, premium), pour tous ses membres. Si Gaulia est
            encore sur le serveur, une configuration vierge est recréée automatiquement, mais
            l&apos;historique ne revient pas.
          </li>
        </ul>
        <p>
          L&apos;historique de modération — les sanctions et avertissements reçus comme ceux donnés
          — relève du serveur qui les a prononcés, et non des membres concernés : il ne part donc
          pas avec la suppression d&apos;un compte, sans quoi il suffirait d&apos;être sanctionné
          pour effacer la trace de sa sanction. Il est effacé avec les données du serveur, ou sur
          demande.
        </p>
        <p>
          Pour une demande que cette page ne couvre pas — le retrait d&apos;une sanction dont vous
          avez fait l&apos;objet sur un serveur que vous n&apos;administrez pas, une rectification,
          ou une question sur le traitement —, écrivez à <Contact /> en indiquant votre identifiant
          Discord (ou celui du serveur concerné). Nous répondons dans un délai d&apos;un mois.
        </p>
        <p>
          Un abonnement premium encore actif chez Discord est resynchronisé automatiquement : pour
          l&apos;arrêter, annulez-le depuis les paramètres Discord. Vous pouvez aussi déposer une
          réclamation auprès de la CNIL (cnil.fr).
        </p>

        <h2>9. Modifications</h2>
        <p>
          Cette politique peut évoluer avec le service. La date de dernière mise à jour figure en
          haut de cette page.
        </p>
      </article>
    </div>
  );
}
