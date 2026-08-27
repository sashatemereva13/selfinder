# Shipping Selfinder — iOS (and later Android)

Working notes on getting `mobile/` built and submitted, since this isn't
obvious from the code alone. Update this as the process changes; it's
process knowledge, not a log of what happened on any one date.

## Build/submit path: EAS, not raw Xcode

Use EAS (`eas build` / `eas submit`), not Xcode's own Archive/Distribute
flow. EAS manages the distribution certificate and provisioning profile
for you and avoids Xcode's account/team picker, which has been flaky
("failed to retrieve development teams") even with an active, fully
enrolled Individual Apple Developer account.

```
cd mobile
eas build --profile production --platform ios --local
eas submit --platform ios --path build-XXXXXXXXX.ipa
```

First time in a project that hasn't run EAS before, you need
`eas build:configure` first (interactive — creates `eas.json` and links
an EAS project id into `app.json`'s `extra.eas.projectId`).

If Xcode's own team picker is ever needed anyway (e.g. for local
`expo run:ios` debugging) and it fails to list your team even though your
Apple Developer membership is active: remove and re-add your Apple ID in
Xcode → Settings → Accounts. That resolves it — no need to touch
membership/agreement status if you already have another live app in App
Store Connect/TestFlight (that alone confirms the account itself is
fine).

## `eas.json` needs its own `env` block — `.env` alone is not enough

A local `.env` file (`EXPO_PUBLIC_API_URL=https://selfinder.online`) is
read by `expo start`/dev builds, but **EAS Build does not automatically
pick it up**. Without an explicit `env` entry on the build profile, EAS
resolves the build with zero environment variables, and since
`EXPO_PUBLIC_*` vars are compiled directly into the JS bundle at build
time (not read at runtime), the shipped `.ipa` would silently have an
empty API base URL — every network call breaks with no error at build
time to warn you. Confirmed this by inspecting `src/api/client.ts`
(`BASE = process.env.EXPO_PUBLIC_API_URL`).

Fix: set it explicitly in `eas.json` per profile:

```json
"production": {
  "autoIncrement": true,
  "env": {
    "EXPO_PUBLIC_API_URL": "https://selfinder.online"
  }
}
```

This value (a public backend URL) is not a secret, so it's fine
committed in `eas.json`. If a future env var actually is sensitive (API
keys, etc.), use EAS's own secret env vars (dashboard or `eas env:create`)
instead of hardcoding it here.

## Prompts you'll see on `eas build` — what to answer

- **"Detected Expo Go usage" warning** — false positive on a project with
  a real prebuilt native `ios/` directory (not running through Expo Go).
  Safe to ignore, or set `EAS_BUILD_NO_EXPO_GO_WARNING=true` to silence
  it.
- **"iOS app only uses standard/exempt encryption?"** → **Y**, as long as
  the app only does standard HTTPS/TLS networking (true here — no custom
  crypto). Answering Y avoids Apple's annual self-classification
  paperwork and repeat prompts on future uploads.
- **"Reuse this distribution certificate?"** → **Y**. Certificates are
  per-Apple-account, not per-app — reusing the same cert across multiple
  apps under one account/team is the normal, correct pattern (Apple caps
  you at a small number of active iOS distribution certs total).
- **"Generate a new Apple Provisioning Profile?"** → **Y** the first time
  a given bundle ID (`com.selfinder.app`) is built through EAS — profiles
  are per-bundle-ID, so an existing profile from a different app won't
  match and a new one is expected/correct.

## `app.json` config gotchas

- **`ios.buildNumber` / `android.versionCode` are NOT tracked in
  `app.json`** — `eas.json`'s `cli.appVersionSource: "remote"` means EAS
  tracks both server-side and auto-increments them on every production
  build (`build.production.autoIncrement: true`), which is why neither
  field exists in `app.json` at all (a stale local value there is
  actively misleading — `eas build` prints a warning and ignores it).
  Confirm the real current values with `eas build:version:get --platform
  ios` / `--platform android` if you ever need to know them (2026-08-26:
  43 / 42). This still leaves Xcode's own signing-team selection exposed
  to `expo prebuild`'s regeneration — re-set it in Xcode after every
  prebuild if building locally there instead of EAS.
- **`expo.version` (the marketing version string, e.g. "1.0.1") IS still
  tracked in `app.json`, unaffected by `appVersionSource: "remote"`** —
  that setting only covers the build number/version code, not this.
  App Store Connect rejects submitting the same version string twice,
  even for a build that was withdrawn/rejected/never released
  ("You've already submitted this version of the app") — bump this by
  hand before resubmitting under a version that's already been
  submitted once, the same way you'd bump a semver patch version.
- **`expo-audio`'s config plugin auto-injects
  `NSMicrophoneUsageDescription` (iOS) and `RECORD_AUDIO` (Android) by
  default**, even if the app only plays audio and never records. Disable
  both explicitly in the plugin config if unused:
  ```json
  ["expo-audio", {
    "enableBackgroundPlayback": true,
    "microphonePermission": false,
    "recordAudioAndroid": false
  }]
  ```
  Confirmed via `node_modules/expo-audio/plugin/src/withAudio.ts` — an
  unused permission is both an unnecessary user-facing prompt and a minor
  App Store review flag.

## Backend dependency

The mobile app is self-contained for build purposes — it doesn't bundle
the backend, only calls it over HTTPS via `EXPO_PUBLIC_API_URL`. No need
to include the `backend` folder in a mobile build/submission. But the
backend must actually be live at that URL before submitting, since App
Store reviewers will exercise real network calls (chat, etc.) and a
dead/local-only backend is a common rejection cause.

## Subscriptions / Your Arc / Journeys

No real purchase flow exists yet for either product, but a real
entitlement source of truth does for both — 2026-08-22: the old single
`User.subscription` field split in two once Selfinder+ became two
differently-shaped products (an ongoing subscription and a repeatable
one-time purchase); 2026-08-23: a further pivot made Your Arc free-
trial-then-subscribe and generalized the one-time-purchase side into an
open-ended "Journey" family, no longer gated behind Your Arc (see
`RULES.md`'s Product/positioning section for the full reasoning on both):

- **Your Arc** — `User.arcSubscription` (`backend/models/User.js`),
  checked client-side via `src/utils/useArcSubscription.ts` (a live
  `GET /user/me` call, not local device state). The only way
  `arcSubscription.active` gets set to `true` today is a manual admin
  grant — run `node backend/scripts/grantArcSubscription.js <username>`
  from `backend/` (add `--revoke` to undo). A signed-out session, or a
  signed-in account with no grant, sees the free `your-arc-preview`
  experience, which now also shows real free-trial progress via
  `src/utils/useArcTrialStatus.ts` (backed by `getMe`'s new
  `savedReadingCount` field). The trial itself — 7 free server-saved
  readings, oldest permanently deleted past that for a non-subscribed
  account — is enforced server-side in
  `backend/controllers/chatController.js`'s `saveMeasureResultIfConsented`,
  not just reflected client-side.
- **Journeys** — `User.journeyPurchases` (an array, not a boolean — each
  purchase is its own entry with its own `journey` key and `seedNonce`,
  since a Journey is bought again and again, never just "owned"), checked
  client-side via `src/utils/useJourneyPurchases.ts` (optionally filtered
  to one Journey, e.g. `useJourneyPurchases('center')`). Grant one
  purchase with `node backend/scripts/grantJourney.js <username>
  <journey>` (`center`/`either-or`/`identity`) — run it again for a
  second, independent purchase of the same or a different Journey (no
  `--revoke`; there's nothing to undo about a past generated result). No
  Your Arc subscription is required to grant or use any Journey.

There is no local dev toggle for either. When real IAP is added,
StoreKit/Play Billing receipt sync should write to these same fields
(`source: 'apple'`/`'google'` instead of `'manual'`) rather than
introducing a separate entitlement mechanism — Your Arc as an
auto-renewing subscription product, each Journey as Apple's "Consumable"
IAP product type (the correct category for a repeatable, non-restoring
purchase, distinct from "Non-Consumable").
