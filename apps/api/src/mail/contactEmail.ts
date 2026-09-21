import { userAvatarUrl } from "../discord/discordApi";
import type { Translator } from "../i18n";

/**
 * Layout of the contact form message. The rendering follows the site palette (indigo to violet
 * gradient, light theme) in mail HTML: tables, inline styles and a fallback colour under the
 * gradient, which Outlook does not render.
 */

export type ContactSubjectId = "question" | "bug" | "premium" | "data" | "other";

export interface ContactMessage {
  /** Identity taken from the Discord session: nothing is typed by hand, so nothing is forgeable. */
  userId: string;
  username: string;
  avatar: string | null;
  email: string;
  subjectId: ContactSubjectId;
  guildId: string;
  /** Server name, resolved from the session; empty when the id is not in it. */
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

/** Every value a visitor typed goes through here before entering the HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The team reads these mails from France, hence the fixed time zone. */
function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

function subjectLabel(t: Translator, message: ContactMessage): string {
  return t(`mail.subjects.${message.subjectId}`);
}

function guildValue(message: ContactMessage): string {
  return message.guildName ? `${message.guildName} (${message.guildId})` : message.guildId;
}

function row(label: string, valueHtml: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font:600 13px ${FONT};color:${TEXT_MUTED};width:150px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font:400 14px ${FONT};color:${TEXT};">${valueHtml}</td>
    </tr>`;
}

export function contactSubject(t: Translator, message: ContactMessage): string {
  return t("mail.contact.subject", {
    subject: subjectLabel(t, message),
    username: message.username,
  });
}

export function contactText(t: Translator, message: ContactMessage): string {
  const rows: [string, string][] = [
    [t("mail.contact.fields.discord"), `${message.username} (${message.userId})`],
    [t("mail.contact.fields.email"), message.email],
    [t("mail.contact.fields.subject"), subjectLabel(t, message)],
  ];
  if (message.guildId) rows.push([t("mail.contact.fields.guild"), guildValue(message)]);
  rows.push([t("mail.contact.fields.receivedAt"), formatDate(message.receivedAt, t.locale)]);

  // Labels differ in length from one language to the next, so the column is padded here.
  const labelWidth = Math.max(...rows.map(([label]) => label.length));

  return [
    t("mail.contact.intro"),
    "",
    ...rows.map(([label, value]) => `${label.padEnd(labelWidth)} : ${value}`),
    "",
    t("mail.contact.messageDivider"),
    message.message,
    "",
    t("mail.contact.replyNotice", { email: message.email }),
  ].join("\n");
}

export function contactHtml(t: Translator, message: ContactMessage): string {
  const rows = [
    row(
      t("mail.contact.fields.email"),
      `<a href="mailto:${escapeHtml(message.email)}" style="color:${BRAND_START};text-decoration:none;">${escapeHtml(message.email)}</a>`,
    ),
    row(
      t("mail.contact.fields.userId"),
      `<code style="font-size:13px;">${escapeHtml(message.userId)}</code>`,
    ),
    row(t("mail.contact.fields.subject"), escapeHtml(subjectLabel(t, message))),
    ...(message.guildId
      ? [
          row(
            t("mail.contact.fields.guild"),
            [
              message.guildName ? `${escapeHtml(message.guildName)}<br />` : "",
              `<code style="font-size:13px;color:${TEXT_MUTED};">${escapeHtml(message.guildId)}</code>`,
            ].join(""),
          ),
        ]
      : []),
    row(t("mail.contact.fields.receivedAt"), escapeHtml(formatDate(message.receivedAt, t.locale))),
  ].join("");

  // The avatar is decorative: mail clients often block remote images, and everything that matters
  // (name, id, address) stays in text.
  const avatar = escapeHtml(userAvatarUrl(message.userId, message.avatar, 128));

  // `white-space: pre-wrap` keeps the message line breaks without turning them into <br>.
  return `<!doctype html>
<html lang="${escapeHtml(t.locale)}">
  <body style="margin:0;padding:24px 12px;background:${PAGE_BG};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;margin:0 auto;background:${CARD_BG};border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
      <tr>
        <td style="background-color:${BRAND_START};background-image:linear-gradient(135deg,${BRAND_START},${BRAND_END});padding:22px 26px;">
          <div style="font:800 20px ${FONT};color:#ffffff;letter-spacing:-0.01em;">Gaulia</div>
          <div style="font:400 14px ${FONT};color:rgba(255,255,255,0.85);margin-top:4px;">${escapeHtml(t("mail.contact.title"))}</div>
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
                <div style="font:400 13px ${FONT};color:${TEXT_MUTED};margin-top:2px;">${escapeHtml(t("mail.contact.verifiedAccount"))}</div>
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
          <div style="font:600 13px ${FONT};color:${TEXT_MUTED};margin-bottom:8px;">${escapeHtml(t("mail.contact.messageLabel"))}</div>
          <div style="border:1px solid ${BORDER};border-left:3px solid ${BRAND_START};border-radius:10px;padding:14px 16px;font:400 14px/1.6 ${FONT};color:${TEXT};white-space:pre-wrap;">${escapeHtml(message.message)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 26px 24px;font:400 12px ${FONT};color:${TEXT_MUTED};">
          ${escapeHtml(t("mail.contact.replyFooter", { email: message.email }))}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
