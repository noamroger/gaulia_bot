import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import type { Translator } from "@/i18n";
import { getTranslator } from "@/i18n/server";
import { CONTACT_EMAIL } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return {
    title: t("account.privacy.meta.title"),
    description: t("account.privacy.meta.description"),
  };
}

/** Fills the {placeholders} of a translated sentence with nodes, so a link can sit inside it. */
function rich(text: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return text.split(/(\{\w+\})/).map((part, index) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={index}>{name ? (nodes[name] ?? part) : part}</Fragment>;
  });
}

/** Mail address of the maintainer, or a plain mention when none is configured. */
function contactNode(t: Translator): ReactNode {
  return CONTACT_EMAIL ? (
    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
  ) : (
    <span>{t("account.privacy.rights.contactFallback")}</span>
  );
}

export default async function PrivacyPage() {
  const t = await getTranslator();
  const contactLink = <Link href="/contact">{t("account.privacy.dashboard.contactLink")}</Link>;

  return (
    <div className="container">
      <p>
        <Link href="/dashboard" className="text-muted">
          ← {t("account.privacy.back")}
        </Link>
      </p>

      <article className="legal">
        <h1>{t("account.privacy.title")}</h1>
        <p className="text-muted">
          {t("account.privacy.lastUpdated", { date: t("account.privacy.updatedOn") })}
        </p>

        <p>{t("account.privacy.intro")}</p>

        <h2>{t("account.privacy.summary.title")}</h2>
        <ul>
          {t.list("account.privacy.summary.points").map((point, index) => (
            <li key={index}>
              {rich(point, {
                myData: <Link href="/my-data">{t("account.privacy.summary.myDataLink")}</Link>,
              })}
            </li>
          ))}
        </ul>

        <h2>{t("account.privacy.bot.title")}</h2>

        <h3>{t("account.privacy.bot.config.title")}</h3>
        <p>{t("account.privacy.bot.config.body")}</p>

        <h3>{t("account.privacy.bot.moderation.title")}</h3>
        <p>{t("account.privacy.bot.moderation.body")}</p>

        <h3>{t("account.privacy.bot.automod.title")}</h3>
        <p>{t("account.privacy.bot.automod.body")}</p>

        <h3>{t("account.privacy.bot.music.title")}</h3>
        <p>{t("account.privacy.bot.music.body")}</p>

        <h3>{t("account.privacy.bot.games.title")}</h3>
        <p>{t("account.privacy.bot.games.body")}</p>
        <p>{t("account.privacy.bot.games.blindtest")}</p>
        <p>{t("account.privacy.bot.games.playlists")}</p>

        <h3>{t("account.privacy.bot.premium.title")}</h3>
        <p>{t("account.privacy.bot.premium.body")}</p>

        <h3>{t("account.privacy.bot.votes.title")}</h3>
        <p>{t("account.privacy.bot.votes.body")}</p>

        <h3>{t("account.privacy.bot.stats.title")}</h3>
        <p>{t("account.privacy.bot.stats.body")}</p>

        <h2>{t("account.privacy.dashboard.title")}</h2>
        <p>{rich(t("account.privacy.dashboard.body"), { contact: contactLink })}</p>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t("account.privacy.dashboard.cookies.name")}</th>
                <th>{t("account.privacy.dashboard.cookies.purpose")}</th>
                <th>{t("account.privacy.dashboard.cookies.lifetime")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>gaulia_session</code>
                </td>
                <td>{t("account.privacy.dashboard.cookies.session")}</td>
                <td>{t("account.privacy.dashboard.cookies.sessionLifetime")}</td>
              </tr>
              <tr>
                <td>
                  <code>gaulia_oauth_state</code>
                </td>
                <td>{t("account.privacy.dashboard.cookies.state")}</td>
                <td>{t("account.privacy.dashboard.cookies.stateLifetime")}</td>
              </tr>
              <tr>
                <td>
                  <code>gaulia_oauth_return</code>
                </td>
                <td>{t("account.privacy.dashboard.cookies.return")}</td>
                <td>{t("account.privacy.dashboard.cookies.returnLifetime")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>{t("account.privacy.dashboard.cookies.note")}</p>

        <h3>{t("account.privacy.dashboard.form.title")}</h3>
        <p>{rich(t("account.privacy.dashboard.form.body"), { contact: contactLink })}</p>

        <h2>{t("account.privacy.logs.title")}</h2>
        <p>{t("account.privacy.logs.body")}</p>

        <h2>{t("account.privacy.retention.title")}</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t("account.privacy.retention.dataColumn")}</th>
                <th>{t("account.privacy.retention.durationColumn")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t("account.privacy.retention.stats")}</td>
                <td>{t("account.privacy.retention.statsDuration")}</td>
              </tr>
              <tr>
                <td>{t("account.privacy.retention.session")}</td>
                <td>{t("account.privacy.retention.sessionDuration")}</td>
              </tr>
              <tr>
                <td>{t("account.privacy.retention.memory")}</td>
                <td>{t("account.privacy.retention.memoryDuration")}</td>
              </tr>
              <tr>
                <td>{t("account.privacy.retention.contact")}</td>
                <td>{t("account.privacy.retention.contactDuration")}</td>
              </tr>
              <tr>
                <td>{t("account.privacy.retention.logs")}</td>
                <td>{t("account.privacy.retention.logsDuration")}</td>
              </tr>
              <tr>
                <td>{t("account.privacy.retention.config")}</td>
                <td>{t("account.privacy.retention.configDuration")}</td>
              </tr>
              <tr>
                <td>{t("account.privacy.retention.premium")}</td>
                <td>{t("account.privacy.retention.premiumDuration")}</td>
              </tr>
              <tr>
                <td>{t("account.privacy.retention.credits")}</td>
                <td>{t("account.privacy.retention.creditsDuration")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>{t("account.privacy.retention.note")}</p>

        <h2>{t("account.privacy.sharing.title")}</h2>
        <p>{t("account.privacy.sharing.intro")}</p>
        <ul>
          {t.list("account.privacy.sharing.partners").map((partner, index) => (
            <li key={index}>{partner}</li>
          ))}
        </ul>
        <p>{t("account.privacy.sharing.note")}</p>

        <h2>{t("account.privacy.security.title")}</h2>
        <p>{t("account.privacy.security.body")}</p>

        <h2>{t("account.privacy.rights.title")}</h2>
        <p>
          {rich(t("account.privacy.rights.body"), {
            myData: <Link href="/my-data">{t("account.privacy.rights.myDataLink")}</Link>,
          })}
        </p>
        <p>{t("account.privacy.rights.manager")}</p>
        <ul>
          <li>
            {rich(t("account.privacy.rights.user"), {
              label: <strong>{t("account.privacy.rights.userLabel")}</strong>,
            })}
          </li>
          <li>
            {rich(t("account.privacy.rights.guild"), {
              label: <strong>{t("account.privacy.rights.guildLabel")}</strong>,
            })}
          </li>
        </ul>
        <p>{t("account.privacy.rights.moderationNote")}</p>
        <p>{rich(t("account.privacy.rights.contactUs"), { contact: contactNode(t) })}</p>
        <p>{t("account.privacy.rights.premiumNote")}</p>

        <h2>{t("account.privacy.changes.title")}</h2>
        <p>{t("account.privacy.changes.body")}</p>
      </article>
    </div>
  );
}
