// The actual policy text, shared between the in-app modal (PrivacyPolicyModal)
// and the standalone public page (legal/PrivacyPolicyPage) so the two never
// drift out of sync — App Store Connect links to the public page directly.
export default function PrivacyPolicyContent({ titleId }) {
  return (
    <>
      <p className="sf-kicker">Selfinder</p>
      <h2 id={titleId} className="privacyModalTitle">Privacy Policy</h2>
      <p className="privacyModalMeta">
        Effective 10 August 2026 · Controller: Aleksandra Temereva, operating
        Selfinder as an individual · Contact:{" "}
        <a href="mailto:altem1309@gmail.com">altem1309@gmail.com</a>
      </p>

      <div className="privacyModalBody">
        <section>
          <h3>Who controls your data</h3>
          <p>
            Selfinder is currently operated by Aleksandra Temereva ("we",
            "us"), as an individual — not through a registered company.
            This section will be updated if Selfinder is ever transferred
            to a registered business entity. For anything in this
            policy — questions, requests, or complaints — write to{" "}
            <a href="mailto:altem1309@gmail.com">altem1309@gmail.com</a>.
          </p>
        </section>

        <section>
          <h3>What we collect when you register</h3>
          <p>
            Your username and a bcrypt-hashed copy of your password —
            never the password itself. You can optionally add an email
            address, used only so we can send you a reset code if you
            forget your password — nothing else.
          </p>
        </section>

        <section>
          <h3>Conversations with your philosopher</h3>
          <p>
            We treat anything you say to your guide as sensitive personal
            data. As part of Selfinder+, a signed-in account that has
            separately granted explicit consent in account settings — the
            same standard that already applies to your assessment results
            below — has its Guide conversations saved to our servers, so
            you can return to them later as part of your history. If a
            conversation followed one of your readings, we also note
            which reading it followed, so you can find your way back to
            it from there. Without that consent, or if you're not signed
            in, Guide conversations exist only on your own device and are
            cleared when the app restarts, exactly as before.
          </p>
        </section>

        <section>
          <h3>Your assessment results and journey progress</h3>
          <p>
            On the web app, your vibration readings and where you are in
            the journey are kept only in your browser's local storage, on
            your own device. On the mobile app, a reading — including the
            actual answers you gave, not just the resulting score — is
            saved to your account only if both are true: you're signed in,
            and you've separately granted explicit consent for it in
            account settings. That consent controls whether a reading is
            <em>stored</em> on our server — it doesn't change how the
            reading is generated in the first place; see "A disclosed
            limitation" below for what that involves regardless of your
            consent setting.
          </p>
        </section>

        <section>
          <h3>Free-writing (Spill)</h3>
          <p>
            Spill is where you write freely, without it being judged or
            scored. By default nothing you write there is saved anywhere —
            it exists only for the length of that writing session and is
            discarded afterward, on web and mobile alike. If you choose to
            keep a specific entry (using "keep this moment," available to
            a signed-in account that has separately granted the same
            explicit consent described above), the text of that entry is
            saved to our servers under your account. Nothing is kept
            unless you take that explicit action for that specific entry —
            granting consent alone doesn't turn on saving everything you
            write. Kept entries are covered by the same export, deletion,
            and consent-withdrawal rights as your conversations and
            assessment results, described below.
          </p>
        </section>

        <section>
          <h3>Cookies and tracking</h3>
          <p>
            We don't use cookies, third-party analytics, or advertising
            trackers. The only data leaving your device is what's
            described in this policy.
          </p>
          <p>
            We do keep a first-party log of which features get used — for
            example, that a Measure reading was completed, which
            philosopher you chose, or what time you set a daily
            reminder for — kept only on our own server, never sent to
            any third party, and never tied to your account or identity.
            Each install gets an anonymous identifier so we can tell a
            returning install from a new one; we use this only to
            understand which parts of Selfinder are actually useful, not
            to track individuals.
          </p>
        </section>

        <section>
          <h3>A disclosed limitation</h3>
          <p>
            When you talk with a philosopher, or answer a question during
            a Measure reading, your message is sent to a third-party AI
            provider (currently Groq, which hosts the language model
            Selfinder uses) to generate the reply or the reading itself.
            This happens every time the feature is used, whether or not
            you're signed in and whether or not you've granted consent to
            save readings to your account — that consent, described
            above, only controls whether the result is later stored on
            our server, not whether it's sent to the AI provider to be
            generated. That provider may process data outside your own
            country. That's true of any product built on a hosted
            language model — we're naming it rather than hiding it. If
            we ever change which provider we use, we'll update this
            section to name the new one.
          </p>
        </section>

        <section>
          <h3>Security</h3>
          <p>
            Passwords are hashed with bcrypt before storage. Sessions
            use signed tokens. Some actions are restricted by account
            role and enforced on the server, not just hidden in the
            interface.
          </p>
        </section>

        <section>
          <h3>Your rights</h3>
          <p>
            You can export everything tied to your account — profile,
            consent history, conversations, assessment results, and any
            free-writing entries you've chosen to keep — as
            a JSON file at any time from your account settings (Your Space
            on web, the You tab on mobile). You can also
            permanently delete your account, which cascades to remove
            your conversations, assessment results, kept free-writing
            entries, and feedback, not
            just your account record. If you're in the EU, EEA, or UK,
            these map to your GDPR rights of access, portability, and
            erasure; we apply the same standard to everyone regardless
            of location.
          </p>
        </section>

        <section>
          <h3>Retention</h3>
          <p>
            Account data is kept until you delete your account.
            Conversation data, assessment results, kept free-writing
            entries, and feedback are kept
            until you withdraw consent or delete your account, whichever
            comes first. Anonymous usage analytics (see "Cookies and
            tracking" above) are never tied to your account or identity,
            so there's no way to look them up or delete them on request —
            we keep them indefinitely to understand which parts of
            Selfinder are actually useful over time.
          </p>
        </section>

        <section>
          <h3>Children</h3>
          <p>
            Selfinder is not directed at children, and we don't
            knowingly collect data from anyone under 16.
          </p>
        </section>

        <section>
          <h3>Complaints</h3>
          <p>
            If you believe we've mishandled your data, contact us first
            at{" "}
            <a href="mailto:altem1309@gmail.com">altem1309@gmail.com</a>{" "}
            so we can fix it. You also have the right to lodge a
            complaint with your country's data protection supervisory
            authority, including the relevant authority if you're in the
            EU, EEA, or UK.
          </p>
        </section>

        <section>
          <h3>Changes to this policy</h3>
          <p>
            If this policy changes in a way that affects your rights,
            we'll update the effective date above and, where required,
            ask for renewed consent.
          </p>
        </section>
      </div>
    </>
  );
}
