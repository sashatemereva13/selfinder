// The real, live privacy policy — a public page on the web app
// (frontend/src/legal/PrivacyPolicyPage.jsx), built specifically because
// App Store Connect and the Play Store console both require a privacy
// policy URL that loads directly. The policy itself is real and
// substantive (data collected, consent mechanics, retention, GDPR
// rights, the AI-provider disclosure) — this constant exists so every
// place in the mobile app that promises "see the privacy policy" (the
// registration checkbox, the AI-disclosure overlay, "Your data &
// privacy" in Account) can actually link to it, rather than making a
// promise with no way to keep it. One shared constant, not three
// hardcoded strings, so the URL never drifts between call sites.
export const PRIVACY_POLICY_URL = 'https://selfinder.online/privacy';
