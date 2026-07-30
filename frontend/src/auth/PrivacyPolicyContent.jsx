// The actual policy text, shared between the in-app modal (PrivacyPolicyModal)
// and the standalone public page (legal/PrivacyPolicyPage) so the two never
// drift out of sync — App Store Connect links to the public page directly.
export default function PrivacyPolicyContent({ titleId }) {
  return (
    <>
      <p className="sf-kicker">Selfinder</p>
      <h2 id={titleId} className="privacyModalTitle">Privacy Policy</h2>
      <p className="privacyModalMeta">
        Effective 30 July 2026 · Controller: Aleksandra Temereva, operating
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
            never the password itself. That's all that's collected to
            create and secure your account.
          </p>
        </section>

        <section>
          <h3>Conversations with your philosopher</h3>
          <p>
            We treat anything you say to your guide as sensitive
            personal data. It is never stored on our servers unless both
            are true: you're signed in, and you've separately granted
            explicit consent for it in your account settings. That consent is
            versioned and logged — both when you grant it and when you
            withdraw it. Withdrawing consent immediately deletes your
            stored conversations without deleting your account.
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
            and you've separately granted explicit consent for it — the
            same standard that already applies to conversations.
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
            example, that a Measure reading was completed — kept only on
            our own server, never sent to any third party, and never tied
            to your account or identity. Each install gets an anonymous
            identifier so we can tell a returning install from a new one;
            we use this only to understand which parts of Selfinder are
            actually useful, not to track individuals.
          </p>
        </section>

        <section>
          <h3>A disclosed limitation</h3>
          <p>
            When you talk with a philosopher, your message is sent to a
            third-party AI provider to generate the reply. That provider
            may process data outside your own country. That's true of
            any product built on a hosted language model — we're naming
            it rather than hiding it.
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
            consent history, conversations, and assessment results — as
            a JSON file at any time from your account settings (Your Space
            on web, the You tab on mobile). You can also
            permanently delete your account, which cascades to remove
            your conversations, assessment results, and feedback, not
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
            Conversation data is kept until you withdraw consent or
            delete your account, whichever comes first.
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
