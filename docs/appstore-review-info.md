# App Store Connect — App Review Information notes

Working copy of what goes in the Notes field of App Review Information,
for the Guideline 2.1 "Information Needed" response (submission
8bb00557-98ef-40ef-8204-8871f11542da, 2026-08-13). Update this file, not
just App Store Connect directly, so a future submission's notes don't
have to be reconstructed from scratch — this is the durable source, App
Store Connect is where it gets pasted.

Status: drafted 2026-08-14, verified against the codebase as of that
date. Re-verify the "additional context" section (esp. what Your Arc
shows) before reusing this for a later submission — that section is the
part most likely to go stale as Selfinder+ features ship.

---

**Demo account:** username `test`, password `test-selfinder`
(enter in the Sign-In Information section of App Review Information, not
just here — Apple's own guidance treats that as the primary place for
credentials).

The `test` account has been granted Selfinder+ access (an admin-side
grant via `backend/scripts/grantSubscription.js` — see
`mobile/docs/shipping.md`'s "Subscriptions / Your Arc" section for how
this works; there is no real purchase flow yet). It has NOT been given
psychological-data consent (the GDPR-required toggle in Account
settings) — a reviewer wanting to see Your Arc's full rich content
(facts, sparkline, sphere history, the wish, the Crossing) needs to
toggle "Save my readings to my account" in Account settings first, same
as any real subscriber would. Without it, Your Arc still renders but
shows its thinner, ungated state.

---

**1. Screen recording:** [ATTACH — see note below]

**2. Devices and OS tested on before submission:**
- Physical devices: iPhone 15 Pro Max (iOS 18, latest available at time
  of testing), iPhone 11 Pro (iOS 17)
- Simulator: additional coverage across iPhone simulators on the latest
  iOS SDK

**3. App description, target audience, problem/value:**
Selfinder is a self-reflection app for people who want a quiet, private
space to check in with themselves — not a clinical or therapy app. The
core loop is "Measure": four short questions (one each for body, mind,
heart, spirit) produce a personal reading of where the user stands right
now, shown as a position on a visual map rather than a score or
diagnosis. Around that core, users can have an open-ended text
conversation with one of five philosopher personas (Socrates, Marcus
Aurelius, Kierkegaard, Camus, Aristotle) in "Guide," free-write privately
in "Spill," and use ambient sound ("Tune In") and breathing exercises.
Over time, repeated readings form "Your Arc," a personal history the
user can revisit — past readings, a private "wish" for how they want
things to feel, and a philosopher-voiced reflection ("the Crossing")
that places today's reading alongside that wish, always ending in an
open question the user answers in their own words, never a conclusion
the app hands them.

Target audience: adults who think of themselves as "overthinkers" —
people who are already capable of reasoning through their own feelings
and decisions, but want a structured tool to help organize that
thinking, similar to journaling. This skews younger (our current testers
are around 20), and the app deliberately doesn't act as a therapist or
advice-giver — it never diagnoses, judges, or tells the user what they
should do. Every feature is designed to help the user structure and hear
their own thinking, not supply an answer for them.

**4. Setup / accessing main features:**
- Launch the app → onboarding screens introduce the concept → user
  registers an account (email/username + password) or signs in.
- Demo account above logs straight into an existing account with data
  already present and Selfinder+ access already granted.
- After login, the main features are reachable from the home/Depths
  screen: "Measure" (start a new reading), "Guide" (talk to a
  philosopher), "Spill" (free write), "Tune In" (ambient sound),
  "Breathing," and "Your Arc" (history of past readings, reachable via
  the labeled point on Depths' own spiral).
- To see Your Arc's full subscriber content specifically: after logging
  in as the demo account, go to Account settings and enable "Save my
  readings to my account" (the psychological-data consent toggle), then
  open Your Arc from Depths.
- No sample files or other special setup are required beyond the above.

**5. External services used:**
- Custom backend REST API (Selfinder's own server) for account
  management, storing readings/conversations/journal entries, and GDPR
  data export/deletion.
- Groq — LLM inference provider used server-side only to power the
  philosopher conversation ("Guide"), the Measure interview, and Your
  Arc's "Crossing" reflection; the app itself never calls Groq directly.
- Expo's local notification scheduling (`expo-notifications`) for
  optional daily reminders — these are scheduled on-device
  (`scheduleNotificationAsync` with a local DATE trigger); no
  remote/push notification service (APNs/FCM) is used.
- No third-party analytics SDK, no payment/IAP processor, and no
  third-party auth provider (login is handled entirely by our own
  backend).

**6. Regional differences:**
The app functions consistently in every region — the only region/locale-
based variation is UI language translation (English/Russian, via
expo-localization/i18next). There is no region-gated content, no
region-specific feature availability, and no App Tracking Transparency
prompt (the app does not track users across apps/websites).

**7. Regulated industry / protected material:**
Selfinder is not a medical, health, or financial app and does not
operate in a regulated industry. It explicitly avoids clinical or
diagnostic language and states in-app that it is a self-reflection
practice, not therapy. The five philosopher personas are original,
hand-written dialogue inspired by each philosopher's publicly known
ideas and teachings (public-domain historical figures) — not licensed or
copyrighted quotations from a third-party rights holder, so no
additional authorization/documentation applies.

---

**Additional context relevant to the checklist above:**

- **Account registration, login, and account deletion:** all present.
  Account deletion is available in-app under Account settings and
  permanently deletes the user's data (GDPR Art. 17).
- **Paid content / subscriptions:** this submission does not include a
  purchasable offer. Selfinder isn't a paid app yet — the planned paid
  tier ("Selfinder+", ~€7.99/month or ~€49.99/year) is still being
  designed and isn't finished, so there's nothing to purchase or price
  in this build: no purchase UI, no StoreKit/IAP integration, and no
  pricing shown anywhere in the app. A real entitlement flag already
  exists server-side (`User.subscription.active`) as groundwork for that
  future tier.

  We're deliberately giving the reviewer full visibility into what
  Selfinder+ will unlock, ahead of it being purchasable by anyone: the
  demo account (`test`) has been granted the entitlement manually
  (`backend/scripts/grantSubscription.js`, a developer-side-only script —
  not a feature any real user can reach; no other account has or can
  currently obtain this access), so the reviewer can see the complete "Your
  Arc" experience — the full reading history, the private "wish," and the
  philosopher-voiced "Crossing" reflection — rather than reviewing a paid
  feature blind. Every core feature (Measure, Guide, Spill, Tune In,
  Breathing) is fully free and complete in itself — nothing in the free
  tier is gated or teased. A signed-out user, or any signed-in user other
  than the demo account, sees an honest free preview of "Your Arc" (a
  partial history, no wish/Crossing) rather than a locked/broken screen.
  We'll submit the real paid tier separately, with full subscription
  details (title, length, price, and links to Terms of Use and Privacy
  Policy), once it's finished and ready to launch.
- **User-generated content:** Guide conversations, Spill journal
  entries, and Your Arc's private "wish" are visible only to the account
  that created them — there is no sharing, feed, or social visibility
  between users, so no content reporting/blocking mechanism is
  applicable. Free-text inputs (Guide messages, Measure answers, the
  wish) are checked by an automated moderation step before being
  reflected back or stored; content signaling self-harm is routed to a
  dedicated crisis-resources screen (locale-aware: a real hotline number
  for US users, a link to findahelpline.com's own directory elsewhere)
  rather than being processed further.
- **Sensitive data/device prompts:** the app requests photo library
  access only when the user explicitly taps "Save" to save a message as
  an image, and local notification permission for optional daily
  reminders. It does not request camera, microphone, location, or
  contacts access, and does not use App Tracking Transparency.
- **Third-party AI data sharing (Guideline 5.1.1(i)/5.1.2(i), also
  raised on this same submission):** Selfinder sends user-entered text
  to Groq (a third-party AI provider) in two features — Guide (a
  message sent to generate the philosopher's reply) and Measure (an
  answer sent to generate the reply and the resulting reading). Before
  either feature can be used for the first time on a given install —
  regardless of sign-in state — the app shows a mandatory one-time
  notice ("Before you begin") naming this plainly and pointing to the
  full privacy policy; the person must tap "Continue" to acknowledge it
  before the feature becomes usable. The privacy policy
  (https://selfinder.online/privacy) discloses this explicitly under "A
  disclosed limitation," naming Groq by name.
