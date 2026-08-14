// The actual terms text, shared between the in-app modal (TermsOfUseModal)
// and the standalone public page (legal/TermsOfUsePage) so the two never
// drift out of sync — App Store Connect links to the public page directly,
// same pattern PrivacyPolicyContent already uses.
export default function TermsOfUseContent({ titleId }) {
  return (
    <>
      <p className="sf-kicker">Selfinder</p>
      <h2 id={titleId} className="privacyModalTitle">Terms of Use</h2>
      <p className="privacyModalMeta">
        Effective 14 August 2026 · Operated by Aleksandra Temereva as an
        individual · Contact:{" "}
        <a href="mailto:altem1309@gmail.com">altem1309@gmail.com</a>
      </p>

      <div className="privacyModalBody">
        <section>
          <h3>What Selfinder is</h3>
          <p>
            Selfinder is a self-reflection practice, not therapy, medical
            treatment, or professional advice of any kind. It doesn't
            diagnose, treat, or claim to improve any medical or mental
            health condition. If you're in crisis or need clinical support,
            Selfinder isn't the right tool — the app's own crisis-support
            screen points to real, professional resources for that.
          </p>
        </section>

        <section>
          <h3>Who can use Selfinder</h3>
          <p>
            You must be at least 16 years old to create an account or use
            Selfinder. By using the app, you confirm you meet that
            requirement.
          </p>
        </section>

        <section>
          <h3>Your account</h3>
          <p>
            You're responsible for whatever happens under your account,
            including keeping your password to yourself. If you think your
            account's been accessed by someone else, contact us at{" "}
            <a href="mailto:altem1309@gmail.com">altem1309@gmail.com</a>{" "}
            and change your password.
          </p>
        </section>

        <section>
          <h3>What you write stays yours</h3>
          <p>
            Anything you write in Selfinder — Measure answers, Guide
            conversations, Spill entries, a wish — belongs to you. We don't
            claim ownership of it, and we don't use it for anything beyond
            running the app and generating your own reflections back to
            you, as described in the{" "}
            <a href="/privacy">Privacy Policy</a>. We don't sell it, and we
            don't use it to train any AI model.
          </p>
        </section>

        <section>
          <h3>Using Selfinder responsibly</h3>
          <p>
            Don't use Selfinder to harm, harass, or impersonate anyone
            else, to attempt to break or abuse the service, or for anything
            illegal. We can suspend or remove an account that does.
          </p>
        </section>

        <section>
          <h3>The free features and Selfinder+</h3>
          <p>
            Measure, Guide, Spill, Tune In, and Breathing are free to use,
            without limitation, for as long as Selfinder exists in its
            current form. Selfinder+ is an optional paid subscription that
            adds deeper access to your own history — never new content,
            never a more complete version of the free practice itself. As
            of this writing, Selfinder+ has no live purchase flow; if and
            when it does, subscription price, billing period, and renewal
            terms will be shown clearly before you buy, and this section
            will be updated with the details required by the App Store and
            Google Play.
          </p>
          <p>
            Where a subscription is purchased through the App Store or
            Google Play, it auto-renews unless cancelled at least 24 hours
            before the end of the current period, and is billed to your
            Apple ID or Google Play account. You can manage or cancel a
            subscription any time in your Apple ID or Google Play account
            settings — Selfinder itself can't cancel it for you. Cancelling
            stops future billing; it never deletes or locks you out of your
            own past readings, conversations, or entries — those remain
            exportable from your account regardless of subscription status,
            per the <a href="/privacy">Privacy Policy</a>.
          </p>
        </section>

        <section>
          <h3>The AI behind Guide and Measure</h3>
          <p>
            When you talk with a philosopher or answer a Measure question,
            your message is sent to a third-party AI provider (currently
            Groq) to generate the reply or reading, as disclosed in the{" "}
            <a href="/privacy">Privacy Policy</a>. The philosopher
            responses are generated, not written by a human in the moment —
            they're a real, hand-authored voice guiding a generated
            conversation, not a transcript of an actual person. Selfinder
            doesn't guarantee the accuracy, appropriateness, or availability
            of any AI-generated response, and a generated reply is never
            professional advice.
          </p>
        </section>

        <section>
          <h3>No warranty</h3>
          <p>
            Selfinder is provided "as is." We don't guarantee it will be
            uninterrupted, error-free, or available at all times. We're not
            liable for any loss or damage arising from your use of the app,
            to the fullest extent the law allows.
          </p>
        </section>

        <section>
          <h3>Changes to Selfinder or these terms</h3>
          <p>
            We may change, suspend, or discontinue any part of Selfinder,
            or update these terms, at any time. If a change affects your
            rights meaningfully, we'll update the effective date above and,
            where required, ask for renewed consent — same as the{" "}
            <a href="/privacy">Privacy Policy</a>. Continuing to use
            Selfinder after a change means you accept the updated terms.
          </p>
        </section>

        <section>
          <h3>Ending your account</h3>
          <p>
            You can delete your account at any time from account settings,
            which permanently removes your data as described in the{" "}
            <a href="/privacy">Privacy Policy</a>. We can also suspend or
            terminate an account that violates these terms.
          </p>
        </section>

        <section>
          <h3>Governing law</h3>
          <p>
            These terms are governed by the law of the operator's place of
            residence, without regard to conflict-of-law rules, except
            where local consumer-protection law gives you rights that
            can't be waived — in which case those rights still apply.
          </p>
        </section>

        <section>
          <h3>Contact</h3>
          <p>
            Questions about these terms:{" "}
            <a href="mailto:altem1309@gmail.com">altem1309@gmail.com</a>.
          </p>
        </section>
      </div>
    </>
  );
}
