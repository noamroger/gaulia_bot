/**
 * Every locale module, imported statically so both languages end up in the client bundle and
 * no dictionary has to travel with each server render. Adding a language file means adding it
 * here too.
 */
import enCommon from "../locales/en/common";
import enNav from "../locales/en/nav";
import enHome from "../locales/en/home";
import enLogin from "../locales/en/login";
import enDashboard from "../locales/en/dashboard";
import enSettings from "../locales/en/settings";
import enAutomod from "../locales/en/automod";
import enMusic from "../locales/en/music";
import enFun from "../locales/en/fun";
import enAdventure from "../locales/en/adventure";
import enPremium from "../locales/en/premium";
import enAdmin from "../locales/en/admin";
import enAccount from "../locales/en/account";
import frCommon from "../locales/fr/common";
import frNav from "../locales/fr/nav";
import frHome from "../locales/fr/home";
import frLogin from "../locales/fr/login";
import frDashboard from "../locales/fr/dashboard";
import frSettings from "../locales/fr/settings";
import frAutomod from "../locales/fr/automod";
import frMusic from "../locales/fr/music";
import frFun from "../locales/fr/fun";
import frAdventure from "../locales/fr/adventure";
import frPremium from "../locales/fr/premium";
import frAdmin from "../locales/fr/admin";
import frAccount from "../locales/fr/account";
import type { AppLocale } from "./locales";
import type { Dictionary } from "./translate";

export const dictionaries: Readonly<Record<AppLocale, Dictionary>> = {
  en: {
    common: enCommon,
    nav: enNav,
    home: enHome,
    login: enLogin,
    dashboard: enDashboard,
    settings: enSettings,
    automod: enAutomod,
    music: enMusic,
    fun: enFun,
    adventure: enAdventure,
    premium: enPremium,
    admin: enAdmin,
    account: enAccount,
  },
  fr: {
    common: frCommon,
    nav: frNav,
    home: frHome,
    login: frLogin,
    dashboard: frDashboard,
    settings: frSettings,
    automod: frAutomod,
    music: frMusic,
    fun: frFun,
    adventure: frAdventure,
    premium: frPremium,
    admin: frAdmin,
    account: frAccount,
  },
};
