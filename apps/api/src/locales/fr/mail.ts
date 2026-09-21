import type { MailStrings } from "../en/mail";

const mail: MailStrings = {
  subjects: {
    question: "Question générale",
    bug: "Signalement de bug",
    premium: "Premium et crédits",
    data: "Données personnelles (RGPD)",
    other: "Autre",
  },
  contact: {
    subject: "[Gaulia] {subject} - {username}",
    intro: "Nouveau message depuis le formulaire de contact de Gaulia.",
    title: "Nouveau message depuis le formulaire de contact",
    verifiedAccount: "compte Discord vérifié",
    messageDivider: "--- Message ---",
    messageLabel: "Message",
    replyNotice: "Répondre à ce mail écrit directement à {email}.",
    replyFooter:
      "Répondre à ce mail écrit directement à {email}, l'adresse du compte Discord qui a envoyé ce message.",
    fields: {
      discord: "Discord",
      email: "Email",
      userId: "Identifiant",
      subject: "Sujet",
      guild: "Serveur",
      receivedAt: "Reçu le",
    },
  },
};

export default mail;
