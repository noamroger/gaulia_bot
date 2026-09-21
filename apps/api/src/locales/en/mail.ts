import type { Dictionary } from "../../i18n/translate";

const mail = {
  subjects: {
    question: "General question",
    bug: "Bug report",
    premium: "Premium and credits",
    data: "Personal data (GDPR)",
    other: "Other",
  },
  contact: {
    subject: "[Gaulia] {subject} - {username}",
    intro: "New message from the Gaulia contact form.",
    title: "New message from the contact form",
    verifiedAccount: "verified Discord account",
    messageDivider: "--- Message ---",
    messageLabel: "Message",
    replyNotice: "Replying to this mail writes straight to {email}.",
    replyFooter:
      "Replying to this mail writes straight to {email}, the address of the Discord account that sent this message.",
    fields: {
      discord: "Discord",
      email: "Email",
      userId: "User id",
      subject: "Subject",
      guild: "Server",
      receivedAt: "Received on",
    },
  },
} satisfies Dictionary;

export type MailStrings = typeof mail;

export default mail;
