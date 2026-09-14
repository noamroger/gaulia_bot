import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Gaulia",
  description: "Comment Gaulia collecte, utilise et conserve les données.",
};

const LAST_UPDATED = "14 septembre 2026";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

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
            Vous pouvez demander la suppression de vos données à tout moment : <Contact />.
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

        <h3>Statistiques</h3>
        <p>
          Pour suivre la santé du service, nous comptons le nombre d&apos;utilisations de chaque
          commande par jour, avec sa catégorie (modération, musique, fun…). Ces compteurs ne
          contiennent ni identifiant d&apos;utilisateur, ni identifiant de serveur, ni contenu : il
          est impossible de savoir qui a utilisé une commande. Ils sont supprimés automatiquement
          après 90 jours. Nous relevons aussi des indicateurs techniques globaux (nombre de
          serveurs, nombre total de membres, latence, mémoire utilisée), sans aucune donnée
          personnelle. Leur historique, par tranche de 10 minutes, est lui aussi supprimé
          automatiquement après 90 jours.
        </p>

        <h2>3. Données traitées par le tableau de bord</h2>
        <p>
          La connexion se fait avec votre compte Discord (autorisations « identify » et « guilds »).
          Nous recevons votre identifiant, votre pseudo, votre avatar et la liste des serveurs que
          vous pouvez gérer. Ces informations sont placées uniquement dans un cookie de session
          signé, et ne sont pas enregistrées en base de données. Le jeton d&apos;accès fourni par
          Discord sert une seule fois, pendant la connexion, puis n&apos;est pas conservé.
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
            </tbody>
          </table>
        </div>
        <p>Ces cookies sont strictement nécessaires au fonctionnement du tableau de bord.</p>

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
          Conformément au RGPD, vous pouvez demander l&apos;accès à vos données, leur rectification
          ou leur suppression. Écrivez à <Contact /> en indiquant votre identifiant Discord (ou
          celui du serveur concerné, si vous en êtes propriétaire ou administrateur). Nous répondons
          dans un délai d&apos;un mois.
        </p>
        <ul>
          <li>
            <strong>Suppression d&apos;un serveur</strong> : toutes ses données sont effacées
            (configuration, historique de modération, avertissements, automod, musique, premium).
          </li>
          <li>
            <strong>Suppression d&apos;un utilisateur</strong> : les sanctions et avertissements
            reçus sont effacés. Les sanctions données en tant que modérateur restent dans
            l&apos;historique du serveur, mais sans identifiant ni pseudo.
          </li>
        </ul>
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
