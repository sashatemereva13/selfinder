// One-off App Store Connect asset generator — iPad 13" screenshots.
// Reuses the run-mobile skill's driver approach (headless Chromium against
// the Expo web build) but at iPad viewport size instead of phone size, so
// the real layout reflows to fill the tablet canvas exactly like the
// existing Android tablet screenshots (assets/play-store-screenshots-tablet-10in/)
// already do — same phone-proportioned UI, stretched/left-aligned into a
// tablet-shaped viewport, not a scaled/letterboxed phone frame.
//
// Apple requires exactly one of: 2064x2752, 2752x2064, 2048x2732, 2732x2048.
//
// Critical: the app caps its reading column at 640 LOGICAL px
// (READING_COLUMN_MAX_WIDTH, src/theme/responsive.ts) — on a real 13" iPad
// Pro (1024x1366 logical pt @ 2x Retina = 2048x2732 raw px), that cap covers
// a meaningful fraction of the screen (640 of 1024pt width). Rendering the
// browser viewport directly at 2048 CSS px (deviceScaleFactor 1) would make
// the same 640px cap cover only 31% of the frame — much sparser than the
// real device ever looks, since RN's useWindowDimensions reports *logical*
// points, not raw pixels. So we set the viewport to the real logical
// resolution (1024x1366) and deviceScaleFactor: 2, which makes Chromium
// render exactly like a real Retina iPad and emit 2048x2732px screenshots —
// on-spec for Apple and true to the app's actual on-device proportions.
//
// Run from mobile/ with the Expo web server already up on :8090.

import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const BASE_URL = process.env.EXPO_WEB_URL ?? "http://localhost:8090";
const OUT_DIR = "assets/appstore-screenshots-ipad-13in";
const IPAD_VIEWPORT = { width: 1024, height: 1366 };
const IPAD_DEVICE_SCALE_FACTOR = 2;

function findChromium() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  const roots = [
    path.join(homedir(), "Library/Caches/ms-playwright"),
    path.join(homedir(), ".cache/ms-playwright"),
  ];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const dirs = readdirSync(root)
      .filter((d) => /^chromium-\d+$/.test(d))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    for (const dir of dirs) {
      const candidates = [
        "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
        "chrome-linux/chrome",
      ].map((rel) => path.join(root, dir, rel));
      for (const c of candidates) if (existsSync(c)) return c;
    }
  }
  return null;
}

mkdirSync(OUT_DIR, { recursive: true });

const exe = findChromium();
const browser = await chromium.launchPersistentContext("/tmp/selfinder-ipad-shots-profile", {
  ...(exe ? { executablePath: exe } : { channel: "chrome" }),
  headless: true,
  viewport: IPAD_VIEWPORT,
  deviceScaleFactor: IPAD_DEVICE_SCALE_FACTOR,
});

const page = await browser.newPage();

async function fresh(route) {
  await page.goto(BASE_URL + route, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE_URL + route, { waitUntil: "networkidle" });
}

async function shot(name) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(file);
}

async function tap(text) {
  await page.getByText(text, { exact: true }).click();
}
async function tapTab(name) {
  // Tab bar labels collide with same-text kickers elsewhere on screen
  // (e.g. "Depths" is both the kicker and the tab) — role scoping picks
  // the actual tab button, not just the first text match.
  await page.getByRole("tab", { name }).click();
}
async function tapXY(x, y) {
  await page.mouse.click(x, y);
}
async function wait(ms) {
  await page.waitForTimeout(ms);
}

try {
  // 1. Onboarding intro, settled state
  await fresh("/onboarding");
  await wait(1600);
  await tapXY(800, 250); // fast-forward the word sequence (empty-space tap, logical coords)
  await wait(900);
  await shot("01-onboarding");

  // 2. Philosopher picker
  await tap("walk");
  await wait(2500);
  await shot("02-philosopher-picker");

  // 3. Guide conversation (after selecting Socrates)
  await tap("Socrates");
  await wait(700);
  await tap("Walk with Socrates");
  await wait(3000);
  await shot("03-guide");

  // 4. Depths (before first reading)
  await tapTab("Depths");
  await wait(1200);
  await shot("04-depths");

  // 5. You tab
  await tapTab("You");
  await wait(1000);
  await shot("05-you");

  // 6. Levels map
  await tapTab("Depths");
  await wait(800);
  await tap("Levels");
  await wait(1200);
  await shot("06-levels-map");

  console.log("done");
} finally {
  await browser.close();
}
