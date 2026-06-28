import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./PrivacyPolicyModal.css";

export default function PrivacyPolicyModal({ onClose }) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const modal = (
    <AnimatePresence>
      <motion.div
        className="privacyModalOverlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="privacyModal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="privacyModalClose"
            onClick={onClose}
            aria-label="Close privacy policy"
          >
            ×
          </button>

          <p className="sf-kicker">Selfinder</p>
          <h2 id={titleId} className="privacyModalTitle">Privacy Policy</h2>
          <p className="privacyModalMeta">
            Effective 28 June 2026 · Controller: AURELIU XIII DIGITAL
            EXPERIENCE, registered in Dubai, United Arab Emirates · Contact:{" "}
            <a href="mailto:sashatemereva13@gmail.com">sashatemereva13@gmail.com</a>
          </p>

          <div className="privacyModalBody">
            <section>
              <h3>Who controls your data</h3>
              <p>
                Selfinder is operated by AURELIU XIII DIGITAL EXPERIENCE
                ("we", "us"), registered in Dubai, United Arab Emirates. For
                anything in this policy — questions, requests, or
                complaints — write to{" "}
                <a href="mailto:sashatemereva13@gmail.com">sashatemereva13@gmail.com</a>.
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
                explicit consent for it in Your Space. That consent is
                versioned and logged — both when you grant it and when you
                withdraw it. Withdrawing consent immediately deletes your
                stored conversations without deleting your account.
              </p>
            </section>

            <section>
              <h3>Your assessment results and journey progress</h3>
              <p>
                Your vibration readings and where you are in the journey are
                currently kept only in your browser's local storage, on your
                own device — they are not transmitted to or stored on our
                servers. If that changes in a future version, it will be
                under the same explicit-consent standard that already
                applies to conversations.
              </p>
            </section>

            <section>
              <h3>Cookies and tracking</h3>
              <p>
                We don't use cookies, third-party analytics, or advertising
                trackers. The only data leaving your device is what's
                described in this policy.
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
                a JSON file at any time from Your Space. You can also
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
                <a href="mailto:sashatemereva13@gmail.com">sashatemereva13@gmail.com</a>{" "}
                so we can fix it. You also have the right to lodge a
                complaint with your local data protection authority — in the
                UAE, or in your country's supervisory authority if you're in
                the EU, EEA, or UK.
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

          <button type="button" className="sf-btn sf-btn-primary privacyModalDone" onClick={onClose}>
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
