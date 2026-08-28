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

## Your Arc / Journeys — fully free for now

**Selfinder is fully free right now, for everyone** (2026-08-28 — see
`RULES.md`'s Product/positioning section for the full reasoning). There's
no legal entity yet to receive real payment, so Your Arc's full history
and every Journey are available to any signed-in, consented user with no
gate. The entitlement fields/scripts below still exist and still work
exactly as described — they're just unused for gating today, kept so real
payment can come back later without a rebuild:

- **Your Arc** — `User.arcSubscription` (`backend/models/User.js`) is
  never checked anywhere anymore; `(tabs)/your-arc/index.tsx` always
  renders the full `your-arc.tsx` experience. `useArcSubscription.ts`,
  `useArcTrialStatus.ts`, and `your-arc-preview.tsx` were deleted
  2026-08-28 once there was nothing left to gate or preview toward. The
  old free-trial cap (7 server-saved readings, oldest deleted past that)
  is gone from `saveMeasureResultIfConsented`
  (`backend/controllers/chatController.js`) — every consented save is
  kept. `grantArcSubscription.js` still works if you want to test what a
  real subscription flag would look like once gating returns, but nothing
  in the app reads it right now.
- **Journeys** — `User.journeyPurchases` (an array, not a boolean — each
  entry is its own record with its own `journey` key and `seedNonce`,
  since a Journey is opened again and again, never just "owned"), checked
  client-side via `src/utils/useJourneyPurchases.ts` (optionally filtered
  to one Journey, e.g. `useJourneyPurchases('center')`). A signed-in user
  with no existing entry for a Journey gets one self-granted automatically
  via `POST /journeys/purchase` (`backend/controllers/
  journeyController.js`'s `postJourneyPurchase`, `source: "free"`) —
  `control.tsx` calls this on mount, `center.tsx` on tapping "Get
  Center." `node backend/scripts/grantJourney.js <username> <journey>`
  still works too (grants with `source: "manual"` instead, for an admin
  comp distinct from the free-tier self-grant) — run it again for a
  second, independent entry of the same or a different Journey (no
  `--revoke`; there's nothing to undo about a past generated result).

There is no local dev toggle for either — the free-tier self-grant above
is the real, always-on path, not a dev-only shortcut. When real IAP is
added and gating comes back, StoreKit/Play Billing receipt sync should
write to these same fields (`source: 'apple'`/`'google'` instead of
`'manual'`/`'free'`) rather than introducing a separate entitlement
mechanism — Your Arc as an auto-renewing subscription product, each
Journey as Apple's "Consumable" IAP product type (the correct category
for a repeatable, non-restoring purchase, distinct from
"Non-Consumable"). Re-add a check in `(tabs)/your-arc/index.tsx`
(`useArcSubscription`-equivalent) and in `control.tsx`/`center.tsx`
(skip the auto-grant, show a real paywall instead) at that point — this
section should be rewritten again then, not left stale.
