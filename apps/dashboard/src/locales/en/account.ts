import type { Dictionary } from "../../i18n/translate";

const account = {
  contact: {
    back: "Back to home",
    title: "Contact us",
    intro:
      "A question, a bug, a request about your data? Write to us here and the answer will reach the address on your Discord account. To view, download or delete your data yourself, the {myData} page does it right away, without waiting for a reply.",
    myDataLink: "My data",
    support: "For quick help, the {support} is often more direct.",
    supportLink: "support server",

    signIn: {
      anonymous: {
        title: "Sign in to write to us",
        body: "The form goes through your Discord account: your username, your id and the address of your account travel with the message. So you have nothing to type, and the answer reaches the right person.",
        action: "Sign in with Discord",
      },
      noEmail: {
        title: "One more permission",
        body: "Your session predates the moment we started asking for your Discord address, or your account has no verified address. Sign in again to allow it to be shared: that address is how we answer you.",
        action: "Sign in again",
      },
    },

    identityHint:
      "Your username, your Discord id and this address travel with the message. None of it can be changed here: it all comes from your session.",

    subject: {
      label: "Subject",
      question: "General question",
      bug: "Report a bug",
      premium: "Premium and credits",
      data: "Personal data (GDPR)",
      other: "Something else",
    },

    guild: {
      label: "Server concerned (optional)",
      none: "None in particular",
      withBot: "With Gaulia",
      withoutBot: "Without Gaulia",
    },

    message: {
      label: "Message",
      counter: "{length} / {max} characters",
      tooShort: "The message must be at least {min} characters long.",
    },

    submit: "Send message",
    sending: "Sending...",
    note: "Your address is only used to answer you. {privacy}",
    privacyLink: "Privacy policy",
    sent: "Message sent. An answer will reach {email}.",
  },

  privacy: {
    meta: {
      title: "Privacy policy - Gaulia",
      description: "How Gaulia collects, uses and keeps data.",
    },

    back: "Back to the dashboard",
    title: "Privacy policy",
    updatedOn: "20 September 2026",
    lastUpdated: "Last updated: {date}",
    intro:
      "This page explains what data the Gaulia Discord bot and its web dashboard handle, why, how long it is kept and how to ask for it to be deleted. It describes how the service actually works, with no boilerplate.",

    summary: {
      title: "1. In short",
      points: [
        "We sell no data and we show no ads.",
        "We never record the content of your messages.",
        "Usage statistics are anonymous (no user id, no server id) and are deleted automatically after 90 days.",
        "The dashboard uses no analytics tool and no advertising cookie.",
        "You can view, download and delete your data yourself at any time from the {myData} page by signing in with Discord, and delete the data of the servers you administer there too.",
      ],
      myDataLink: "My data",
    },

    bot: {
      title: "2. Data handled by the bot",

      config: {
        title: "Server configuration",
        body: "For every server Gaulia is added to: the id, name, icon and member count of the server, its language, the channels and roles picked in the configuration (log channels, DJ role, music channel, channels allowed for fun commands), and its premium status. This data keeps the bot running and feeds the dashboard.",
      },

      moderation: {
        title: "Moderation",
        body: "When a moderator uses a sanction command (ban, kick, timeout, warning, purge...), Gaulia records the id and username of the sanctioned member and of the moderator, the type of sanction, the reason given, the duration if there is one, and the date. Server moderators can read that history through the bot commands, and a summary of each sanction can be posted in the log channel the server picked. The moderation settings of the server (direct message to the sanctioned member, automatic sanctions after a number of warnings) are stored as well.",
      },

      automod: {
        title: "Automoderation",
        body: "Gaulia stores the automod configuration (enabled rules, lists of banned domains, invites and words, chosen sanctions, ignored channels and roles). To catch spam, the bot keeps the last message and the timing of each member's recent messages in memory. That information is never written to disk or to a database, and it disappears when the bot restarts. When a rule is broken, the message is deleted, the sanction chosen by the server is applied (and recorded in the moderation history), and a notice (author username, channel, type of breach and sanction, without the content of the message) can be posted in the server log channel. Discord's native AutoMod rules are enforced by Discord itself.",
      },

      music: {
        title: "Music",
        body: "Gaulia only stores the music settings of the server (default volume and repeat mode, 24/7 mode, dedicated channel and DJ role). Your searches are sent to our audio server to find the track, then to SoundCloud (and to Spotify when you share a Spotify link). The queue, with the id and username of whoever requested each track, only exists in memory during playback and is never stored.",
      },

      games: {
        title: "Games and entertainment",
        body: "The games of the fun module (Connect 4, tic-tac-toe, hangman, Wordle, blackjack) keep the state of each running game (player ids, board, word to find, guesses) in memory only. It disappears when the game ends, after 10 minutes of inactivity or when the bot restarts, and it is never stored. The result of the lovecalc command is computed from the Discord ids of the two members, keeping nothing.",
        blindtest:
          "During a blindtest, Gaulia reads the messages sent in the game channel by the members present in the voice channel, only to compare them with the expected answer: they are neither recorded nor kept. Scores (player ids and points) stay in memory and disappear when the game ends. The clips played are the 30 second previews Spotify makes public, replayed by our audio server (or found on SoundCloud when they are missing): no data about you is sent to Spotify.",
        playlists:
          "The managers of a server can create blindtest track lists from the dashboard. We store the name of each list and, for every track, its title, its artist, its duration and its Spotify links, along with the server configuration. To import a Spotify link, our server reads the matching public page on Spotify, without sending any data about you. These lists are deleted along with the rest of the server data.",
      },

      premium: {
        title: "Premium subscription",
        body: "Gaulia Premium subscriptions are sold and managed by Discord: we never see or store any payment information. We keep a copy of the entitlements Discord sends us (subscription id, plan, server or user concerned, start and end dates) to switch the premium features on.",
      },

      votes: {
        title: "top.gg votes and credits",
        body: "If you vote for Gaulia on top.gg, top.gg sends us your Discord id, your username, the address of your avatar and the date of the vote. We store the id of each vote (so the same vote is never credited twice), your credit balance and the history of your credit movements (votes, redemptions for gifted premium, adjustments by a bot administrator). This data only exists to make credits work: you can see it on the dashboard, and the bot owners can see it in their admin panel. It is kept as long as your credit account exists, and deleted on request. We receive no account information from top.gg beyond what is listed here.",
      },

      stats: {
        title: "Statistics",
        body: "To keep an eye on the health of the service, we count how many times each command is used per day, along with its category (moderation, music, fun...). These counters hold no user id, no server id and no content: there is no way to tell who used a command. They are deleted automatically after 90 days. We also record global technical indicators (number of servers, total member count, latency, memory used), without any personal data. Their history, in 10 minute buckets, is deleted automatically after 90 days too. The total number of servers, of members and of commands used over the last 30 days is shown publicly on the home page, with no detail per server or per user.",
      },
    },

    dashboard: {
      title: "3. Data handled by the dashboard",
      body: "Signing in goes through your Discord account, with the identify, guilds and email scopes. We receive your id, your username, your avatar, the verified address of your account and the list of servers you can manage. That information only goes into a signed session cookie, and is not stored in a database. The address is only used to answer you if you write from the {contact} page: it is never added to a mailing list. The access token Discord provides is used once, during sign-in, and is not kept afterwards.",
      contactLink: "Contact us",

      cookies: {
        name: "Cookie",
        purpose: "Purpose",
        lifetime: "Lifetime",
        session: "Keep your session open",
        sessionLifetime: "12 hours",
        state: "Secure the sign-in with Discord",
        stateLifetime: "5 minutes",
        return: "Send you back to the page you signed in from",
        returnLifetime: "5 minutes",
        note: "These cookies are strictly necessary for the dashboard to work.",
      },

      form: {
        title: "Contact form",
        body: "The {contact} page requires a Discord sign-in. The message you send carries your username, your id, your avatar and the verified address of your account, all taken from your session, so nothing is typed by hand and nobody can write pretending to be you. The whole thing is emailed to the bot administrator. Nothing is stored in a database: the message lives in the mailbox that receives it, and your address is only used to answer you. To limit abuse, the number of messages per account is capped; those counters stay in memory and disappear when the service restarts.",
      },
    },

    logs: {
      title: "4. Technical logs",
      body: "Our servers record technical logs (incoming requests with the connecting IP address, server ids and errors) to keep the service secure and to fix problems. They serve no other purpose and are erased automatically by rotation (50 MB per service at most).",
    },

    retention: {
      title: "5. How long data is kept",
      dataColumn: "Data",
      durationColumn: "Kept for",

      stats: "Usage statistics and history of the technical indicators (anonymous)",
      statsDuration: "90 days, then deleted automatically",
      session: "Dashboard session",
      sessionDuration: "12 hours",
      memory: "Anti-spam memory, music queue and running games",
      memoryDuration: "Until the bot restarts, never stored",
      contact: "Messages sent from the contact form",
      contactDuration:
        "Never stored in a database: kept in the administrator mailbox for as long as the request takes",
      logs: "Technical logs",
      logsDuration: "Automatic rotation (50 MB per service at most)",
      config: "Configuration, moderation history, settings",
      configDuration: "Until a deletion request",
      premium: "Premium entitlements",
      premiumDuration: "As long as the subscription exists on Discord",
      credits: "top.gg votes and credits",
      creditsDuration: "Until a deletion request",

      note: "Removing Gaulia from a server stops any new collection for that server. The data already stored is kept in case the bot is added again, until you ask for it to be deleted.",
    },

    sharing: {
      title: "6. Data sharing",
      intro: "Your data is only shared with the services the bot needs to run:",
      partners: [
        "Discord, the platform the bot runs on;",
        "SoundCloud and Spotify, only for the music searches you start;",
        "top.gg, if you choose to vote for Gaulia there: top.gg is the one sending us your vote, and all we send it is the number of servers the bot is in;",
        "the host of the server running the bot, the API and the database.",
      ],
      note: "No data is sold, rented or used for advertising.",
    },

    security: {
      title: "7. Security",
      body: "The database can only be reached from the internal network of our servers. The dashboard and the API are served over HTTPS. Administration of the service is restricted to the bot owners.",
    },

    rights: {
      title: "8. Your rights",
      body: "Under the GDPR, you can access your data, obtain a copy of it and ask for it to be deleted. The {myData} page does exactly that, without going through us: sign in with Discord and you will find the detail of what is stored about your account, a download in JSON format and a permanent deletion button. The Discord sign-in is what proves the account is yours, so nobody else can read or erase your data.",
      myDataLink: "My data",
      manager:
        "The same page also lets you delete the data of a server you administer (with the Manage Server permission on the Discord side).",

      userLabel: "Deleting a user",
      user: "{label}: the credit account and its history, the stored top.gg votes, the cached premium entitlements and the adventure character with its inventory and progress are erased.",
      guildLabel: "Deleting a server",
      guild:
        "{label}: all of its data is erased (configuration, moderation history, warnings, automod, music, blindtest lists, adventure settings, premium), for every member. If Gaulia is still on the server, a blank configuration is created again automatically, but the history does not come back.",

      moderationNote:
        "The moderation history (sanctions and warnings received as well as given) belongs to the server that issued them, not to the members involved: it does not leave with the deletion of an account, otherwise getting sanctioned would be enough to erase the trace of the sanction. It is erased with the server data, or on request.",
      contactUs:
        "For a request this page does not cover (lifting a sanction you received on a server you do not administer, a correction, or a question about the processing), write to {contact} with your Discord id (or the id of the server concerned). We answer within one month.",
      contactFallback: "the Gaulia team",
      premiumNote:
        "A premium subscription still active on Discord is resynchronised automatically: to stop it, cancel it from your Discord settings. You can also file a complaint with the CNIL (cnil.fr).",
    },

    changes: {
      title: "9. Changes",
      body: "This policy may change along with the service. The date of the last update is shown at the top of this page.",
    },
  },

  myData: {
    meta: {
      title: "My data - Gaulia",
      description: "View, download or delete the data Gaulia keeps about your account.",
    },

    back: "Back to home",
    title: "My data",
    intro:
      "Everything Gaulia keeps about your Discord account, to read, to download or to delete yourself, without having to write to anyone. For the detail of what is collected and why, the {privacy} explains every point.",
    privacyLink: "privacy policy",

    signIn: {
      title: "Sign in to see your data",
      body: "This page shows what Gaulia keeps about your Discord account, so it goes through a Discord sign-in: that is what proves the account is yours, and nobody else can read or delete your data.",
      action: "Sign in with Discord",
    },

    confirm: {
      word: "DELETE",
      label: "Type {word} to confirm",
      pending: "Deleting...",
      action: "Confirm permanent deletion",
    },

    account: {
      hint: "Your username, your avatar and your address come from Discord and only live in your session cookie, for 12 hours. They are not stored in a database.",
      download: "Download my data (JSON)",
      fileName: "gaulia-my-data-{userId}.json",
      generatedAt: "Snapshot taken on {date}",
    },

    stored: {
      title: "What we have stored",
      subtitle:
        "The ids of other members (the moderator behind a sanction, the partner in a trade) are not here: that is their data, not yours.",
      none: "None",
    },

    columns: {
      guild: "Server",
      type: "Type",
      reason: "Reason",
      duration: "Duration",
      date: "Date",
      status: "Status",
      movement: "Movement",
      amount: "Amount",
      balanceAfter: "Balance after",
      start: "Start",
      end: "End",
    },

    sanctions: {
      title: "Sanctions received",
      empty: "No sanction recorded against your account.",
      note: "These lines belong to the history of the servers that issued them: they do not leave with the deletion of your account. To have them removed, ask the people running the server, or write to us from the {contact} page.",
    },

    warns: {
      title: "Warnings received",
      empty: "No warning recorded against your account.",
      note: "Like sanctions, they belong to the server that gave them and do not leave with the deletion of your account.",
      active: "Active",
      removed: "Removed",
    },

    moderator: {
      title: "Sanctions issued as a moderator",
      empty: "You have not sanctioned anyone with Gaulia.",
      cases: "Sanctions issued",
      warns: "Warnings given",
      note: "These lines belong to the history of the servers concerned as well.",
    },

    credits: {
      title: "Credits and top.gg votes",
      empty: "No credit account: you have never voted for Gaulia.",
      balance: "Current balance",
      totalEarned: "Total earned so far",
      voteCount: "Votes counted",
      lastVote: "Last vote",
      votesNote: {
        one: "{value} vote kept on file, only so the same one is never credited twice. The detail is in the JSON file.",
        other:
          "{value} votes kept on file, only so the same one is never credited twice. The detail is in the JSON file.",
      },
    },

    premium: {
      title: "Premium entitlements",
      empty: "No premium subscription attached to your account.",
      active: "Active",
      ended: "Ended",
      note: "These are the entitlements sent by Discord. No payment information ever reaches us: the subscription itself is managed from your Discord settings.",
    },

    adventure: {
      title: "Adventure",
      empty: "No adventure character created.",
      characterClass: "Class",
      level: "Level",
      totalXp: "Total experience",
      goldAndEchoes: "Gold and echoes",
      items: "Items in inventory",
      achievements: "Achievements unlocked",
      record: "Explorations · wins · losses",
      lastPlayed: "Last game",
      note: "The inventory, the quests, the journal and the trade history are all in the JSON file in full.",
    },

    guilds: {
      title: "Servers you can manage",
      empty: "No server can be managed with this account.",
      note: "This list comes from Discord at every sign-in and is not stored. It tells us which servers to show in the dashboard.",
    },

    deleteAccount: {
      title: "Delete my data",
      subtitle: "Deletion is permanent and immediate. It erases what follows your account:",
      items: [
        "your credit account, its history and your stored top.gg votes;",
        "your adventure character, its inventory and its progress;",
        "the premium entitlements cached for your account.",
      ],
      note: "The moderation history is not part of it: a sanction or a warning belongs to the server that issued it, not to the member concerned. It leaves with the server data, below if you administer that server, otherwise on request to the people running it or to us from the {contact} page. A premium subscription still active on Discord will be resynchronised automatically: to stop it, cancel it from your Discord settings.",
      action: "Delete my data",
    },

    deleteGuild: {
      title: "Delete the data of a server",
      subtitle:
        "The servers you administer and for which Gaulia has stored something. Deleting erases the data of the whole server, for every member, moderation history included.",
      empty: "None of the servers you administer has data stored with Gaulia.",
      action: "Delete the data of this server",
      deleted: "The data of this server has been deleted.",
      deletedBotPresent:
        "Gaulia is still there, so a blank configuration will be created again automatically.",
      note: "Everything goes at once, for every member of the server: configuration, moderation history, warnings, automod, music, blindtest lists and adventure settings.",
      noteBotPresent:
        "Gaulia is still on the server, so a blank configuration will be created at the next sync, but the history does not come back.",
      present: "Gaulia is there",
      left: "Gaulia has left",
      fallback: "Server {id}",

      cases: "Sanctions in the history",
      warns: "Warnings",
      playlists: "Blindtest lists",
      premium: "Cached premium entitlements",
      config: { label: "Server configuration", stored: "Stored", none: "None" },
      automod: { label: "Automod rules", stored: "Stored", none: "None" },
      music: { label: "Music settings", stored: "Stored", none: "None" },
      adventure: { label: "Adventure settings", stored: "Stored", none: "None" },
    },

    done: {
      notice: "Your data has been deleted.",
      body: "Your session has been closed, since it held your username and your address too. The moderation history of the servers and the configuration of the ones you administer have not been touched: they belong to the servers. If you keep using Gaulia, new data may be created, and this page will let you delete it again.",
      home: "Back to home",
    },

    duration: {
      minutes: "{value} min",
      hours: "{value} h",
      days: "{value} d",
    },

    caseTypes: {
      BAN: "Ban",
      UNBAN: "Unban",
      KICK: "Kick",
      TIMEOUT: "Timeout",
      UNTIMEOUT: "Timeout lifted",
      WARN: "Warning",
      UNWARN: "Warning removed",
      PURGE: "Message purge",
    },

    creditTypes: {
      VOTE: "top.gg vote",
      PREMIUM_REDEEM: "Redeemed for premium",
      ADMIN_ADJUST: "Adjustment by an administrator",
      PREMIUM_REFUND: "Refund of gifted premium",
    },

    classes: {
      GUERRIER: "Warrior",
      MAGE: "Mage",
      RODEUR: "Ranger",
    },
  },
} satisfies Dictionary;

export type AccountStrings = typeof account;

export default account;
