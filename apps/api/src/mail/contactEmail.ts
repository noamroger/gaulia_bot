import { userAvatarUrl } from "../discord/discordApi";

/**
 * Mise en forme du message envoyé par le formulaire de contact. Le rendu reprend la palette du
 * site (dégradé indigo → violet, thème clair) en HTML de mail : tableaux, styles en ligne et
 * couleur de repli sous le dégradé, qu'Outlook n'affiche pas.
 */

export interface ContactMessage {
  /** Identité issue de la session Discord : rien n'est saisi à la main, donc rien n'est usurpable. */
  userId: string;
  username: string;
  avatar: string | null;
  email: string;
  subjectLabel: string;
  guildId: string;
  /** Nom du serveur, résolu depuis la session ; vide si l'identifiant n'y figure pas. */
  guildName: string;
  message: string;
  receivedAt: Date;
}

const BRAND_START = "#5865f2";
const BRAND_END = "#8b5cf6";
const PAGE_BG = "#f4f5fb";
const CARD_BG = "#ffffff";
const BORDER = "#e1e4ee";
const TEXT = "#171a21";
const TEXT_MUTED = "#5d6474";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Toute valeur saisie par un visiteur passe par ici avant d'entrer dans le HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

function row(label: string, valueHtml: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font:600 13px ${FONT};color:${TEXT_MUTED};width:150px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font:400 14px ${FONT};color:${TEXT};">${valueHtml}</td>
    </tr>`;
}

export function contactSubject(message: ContactMessage): string {
  return `[Gaulia] ${message.subjectLabel} — ${message.username}`;
}

export function contactText(message: ContactMessage): string {
  return [
    `Nouveau message depuis le formulaire de contact de Gaulia.`,
    ``,
    `Discord   : ${message.username} (${message.userId})`,
    `Email     : ${message.email}`,
    `Sujet     : ${message.subjectLabel}`,
    ...(message.guildId
      ? [
          `Serveur   : ${message.guildName ? `${message.guildName} (${message.guildId})` : message.guildId}`,
        ]
      : []),
    `Reçu le   : ${formatDate(message.receivedAt)}`,
    ``,
    `--- Message ---`,
    message.message,
    ``,
    `Répondre à ce mail écrit directement à ${message.email}.`,
  ].join("\n");
}

export function contactHtml(message: ContactMessage): string {
  const rows = [
    row(
      "Email",
      `<a href="mailto:${escapeHtml(message.email)}" style="color:${BRAND_START};text-decoration:none;">${escapeHtml(message.email)}</a>`,
    ),
    row("Identifiant", `<code style="font-size:13px;">${escapeHtml(message.userId)}</code>`),
    row("Sujet", escapeHtml(message.subjectLabel)),
    ...(message.guildId
      ? [
          row(
            "Serveur",
            [
              message.guildName ? `${escapeHtml(message.guildName)}<br />` : "",
              `<code style="font-size:13px;color:${TEXT_MUTED};">${escapeHtml(message.guildId)}</code>`,
            ].join(""),
          ),
        ]
      : []),
    row("Reçu le", escapeHtml(formatDate(message.receivedAt))),
  ].join("");

  // L'avatar est décoratif : les clients mail bloquent souvent les images distantes, et toute
  // l'information utile (pseudo, identifiant, adresse) reste en texte.
  const avatar = escapeHtml(userAvatarUrl(message.userId, message.avatar, 128));

  // `white-space: pre-wrap` garde les retours à la ligne du message sans les convertir en <br>.
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px 12px;background:${PAGE_BG};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;margin:0 auto;background:${CARD_BG};border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
      <tr>
        <td style="background-color:${BRAND_START};background-image:linear-gradient(135deg,${BRAND_START},${BRAND_END});padding:22px 26px;">
          <div style="font:800 20px ${FONT};color:#ffffff;letter-spacing:-0.01em;">Gaulia</div>
          <div style="font:400 14px ${FONT};color:rgba(255,255,255,0.85);margin-top:4px;">Nouveau message depuis le formulaire de contact</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 26px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right:14px;" valign="middle">
                <img src="${avatar}" width="52" height="52" alt="" style="display:block;width:52px;height:52px;border-radius:26px;border:1px solid ${BORDER};background:${PAGE_BG};" />
              </td>
              <td valign="middle">
                <div style="font:700 17px ${FONT};color:${TEXT};">${escapeHtml(message.username)}</div>
                <div style="font:400 13px ${FONT};color:${TEXT_MUTED};margin-top:2px;">compte Discord vérifié</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 26px 6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 26px 26px;">
          <div style="font:600 13px ${FONT};color:${TEXT_MUTED};margin-bottom:8px;">Message</div>
          <div style="border:1px solid ${BORDER};border-left:3px solid ${BRAND_START};border-radius:10px;padding:14px 16px;font:400 14px/1.6 ${FONT};color:${TEXT};white-space:pre-wrap;">${escapeHtml(message.message)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 26px 24px;font:400 12px ${FONT};color:${TEXT_MUTED};">
          Répondre à ce mail écrit directement à ${escapeHtml(message.email)}, l'adresse du compte
          Discord qui a envoyé ce message.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
