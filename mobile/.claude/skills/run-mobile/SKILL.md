---
name: run-mobile
description: Run, start, and screenshot the Selfinder Expo mobile app on web. Use when asked to launch the app, take screenshots of a screen (onboarding, Depths, Guide, You), drive a flow, or visually verify a UI change.
---

The Selfinder mobile app (Expo SDK 57 / expo-router). For visual verification, run it as a web app (`expo start --web`) and drive it headlessly with `.claude/skills/run-mobile/driver.mjs` (playwright-core). Web preview is an approximation — SVG filters, haptics, and expo-media-library behave differently on device; treat on-device as the real check and web screenshots as layout/flow verification.

All paths below are relative to `mobile/`.

## Setup

Requires Node (repo developed on v22) and a Chromium: the driver auto-finds a cached `ms-playwright` Chromium (`~/Library/Caches/ms-playwright` or `~/.cache/ms-playwright`), else falls back to system Chrome; override with `CHROMIUM=/path/to/chromium`.

```bash
npm i --include=dev --no-audit --no-fund
```

`--include=dev` is required: this machine's shell has `NODE_ENV=production`, which makes npm silently skip devDependencies (`playwright-core` among them). A plain `npm i` reports "up to date" while leaving them uninstalled.

## Run (agent path)

1. Start the dev server in the background (takes ~15s to first 200):

```bash
npx expo start --web --port 8090 > /tmp/expo-web.log 2>&1 &
for i in $(seq 1 30); do curl -s -o /dev/null -w "%{http_code}" http://localhost:8090 | grep -q 200 && break; sleep 2; done
```

2. Drive it. The driver loads a route in a 390×844 viewport and executes actions in order:

```bash
node .claude/skills/run-mobile/driver.mjs <route> [--fresh] [--out DIR] [actions...]
```

| arg | what it does |
|---|---|
| `--fresh` | clear localStorage first → pre-onboarding state (no philosopher chosen) |
| `--out DIR` | screenshot directory (default `/tmp/selfinder-shots`) |
| `--wait <ms>` | wait until `ms` after page load (or after the last tap) |
| `--shot <name>` | screenshot to `<out>/<name>.png` |
| `--tap "<text>"` | click the element with that exact text |
| `--tapxy <x,y>` | click viewport coordinates (for no-text targets like the philosopher symbols) |

`--wait` values are absolute from load / last tap, not deltas — `--wait 2200 --shot a --wait 6000 --shot b` lands at 2.2s and 6.0s.

Verified examples:

```bash
# Onboarding beats, then tap "walk" and catch the line-to-ring morph:
node .claude/skills/run-mobile/driver.mjs /onboarding --fresh \
  --wait 2200 --shot beat-what --wait 8200 --shot settled \
  --tap walk --wait 900 --shot ring-morph

# Complete onboarding end-to-end (skipping the intro with a tap), land on
# Guide, then hop to the You tab via the tab bar — all in one run:
node .claude/skills/run-mobile/driver.mjs /onboarding --fresh \
  --wait 1600 --tapxy 320,180 --wait 800 --tap walk --wait 2500 \
  --tap Socrates --wait 700 --tap "Walk with Socrates" --wait 3000 --shot guide-tab \
  --tap You --wait 1200 --shot you-tab
```

Onboarding timeline (fixed, from load): greet figure alone 0–1.3s; word beats at ~1.9s ("what"), 3.1s ("you"), 4.3s ("feel"), 5.5s ("is an experience"), 6.7s (payoff); "walk" button ~7.5s; dot merges settle by ~11s. After tapping "walk", the exit morph runs 0.9s + 0.5s ring hold before the picker appears.

3. Stop the server when done:

```bash
lsof -ti:8090 | xargs kill
```

## Run (human path)

```bash
npm run web    # opens browser at :8081 — Ctrl-C to stop
```

On-device: Expo Go / dev build via `npm start`. Not driveable from here.

## Typecheck

```bash
npx tsc --noEmit
```

## Gotchas

- **Tab routes redirect to `/onboarding`, and nothing persists on web.** `expo-secure-store` has no web implementation, so every page load boots as a brand-new user — a philosopher chosen in one driver run is gone in the next. To screenshot a tab, do it all in ONE driver invocation: complete onboarding (second verified example above), then navigate via the tab bar with `--tap Depths` / `--tap Guide` / `--tap You`.
- **The philosopher picker needs two taps.** First tap (symbol or name label — both work) focuses and reveals the "Walk with {name}" confirm button; tap that by text to select.
- **Onboarding's intro fast-forwards on any tap.** A tap on empty space (e.g. `--tapxy 320,180`) jumps the whole word sequence to its settled state ~350ms later. To photograph the individual beats, don't tap — `--wait` to each timestamp instead.
- **Philosopher ring entrances are staggered.** A screenshot right after the picker appears can be missing the last philosopher (Aristotle) — it's entrance-animation stagger, not a bug. Wait ~2.5s after "walk"'s morph completes.
- **`expo-media-library` breaks web bundling** — already worked around by `src/utils/saveMessageImage.web.ts`; don't remove the shim.

## Troubleshooting

- **`npm i` says "up to date" but `playwright-core` is missing**: `NODE_ENV=production` in the shell → npm omits devDependencies. Run `npm i --include=dev`. If it still skips, delete the stale manifest first: `rm node_modules/.package-lock.json && npm i --include=dev`.
- **Driver exits with "browserType.launch: executable doesn't exist"**: no cached Chromium and no system Chrome. Point `CHROMIUM` at any Chromium binary.
- **Port 8090 already in use**: a previous server is still up — `lsof -ti:8090 | xargs kill`.
