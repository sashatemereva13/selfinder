// Headless browser driver for the Selfinder Expo app running on web.
// Run from mobile/ with the expo web server already up (see SKILL.md):
//
//   node .claude/skills/run-mobile/driver.mjs <route> [--fresh] [--out DIR] [actions...]
//
// Actions execute in the order given:
//   --wait <ms>     pause (animations here run on fixed timelines — see SKILL.md)
//   --shot <name>   screenshot to <out>/<name>.png
//   --tap "<text>"  click the element with that exact text
//   --tapxy <x,y>   click viewport coordinates — for targets with no text,
//                   like the philosopher symbols in the onboarding ring
//
// Example — onboarding beats, then tap "walk" and catch the ring morph:
//   node .claude/skills/run-mobile/driver.mjs /onboarding --fresh \
//     --wait 2200 --shot what --wait 6000 --shot settled \
//     --tap walk --wait 900 --shot ring
//
// --fresh clears localStorage (web's SecureStore shim) before loading, so
// pre-onboarding state — no philosopher chosen — is reproducible.
// Browser: set CHROMIUM to an executable path, otherwise the newest cached
// ms-playwright Chromium is used, otherwise system Chrome.

import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const BASE_URL = process.env.EXPO_WEB_URL ?? "http://localhost:8090";

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

const argv = process.argv.slice(2);
if (!argv[0] || argv[0].startsWith("--")) {
  console.error("usage: driver.mjs <route> [--fresh] [--out DIR] [--wait ms | --shot name | --tap text]...");
  process.exit(2);
}
const route = argv[0];
let outDir = "/tmp/selfinder-shots";
let fresh = false;
const actions = [];
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--fresh") fresh = true;
  else if (a === "--out") outDir = argv[++i];
  else if (a === "--wait" || a === "--shot" || a === "--tap" || a === "--tapxy") actions.push([a, argv[++i]]);
  else {
    console.error(`unknown arg: ${a}`);
    process.exit(2);
  }
}
mkdirSync(outDir, { recursive: true });

const exe = findChromium();
// A persistent profile, so localStorage (the web build's SecureStore shim)
// survives across driver invocations — without it every run is a brand-new
// user and tab routes bounce back to /onboarding. --fresh wipes it.
const browser = await chromium.launchPersistentContext("/tmp/selfinder-driver-profile", {
  ...(exe ? { executablePath: exe } : { channel: "chrome" }),
  headless: true,
  viewport: { width: 390, height: 844 },
});
try {
  const page = await browser.newPage();
  const url = BASE_URL + route;
  if (fresh) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
  }
  await page.goto(url, { waitUntil: "networkidle" });
  // Timestamps are measured from load, not from the previous action, so
  // "--wait 2200 --shot a --wait 6000 --shot b" lands at 2.2s and 6s —
  // matching how the app's own animation timelines are written.
  const t0 = Date.now();
  let clock = t0;
  for (const [op, arg] of actions) {
    if (op === "--wait") {
      const target = clock + Number(arg);
      const ms = target - Date.now();
      if (ms > 0) await page.waitForTimeout(ms);
    } else if (op === "--shot") {
      const file = path.join(outDir, `${arg}.png`);
      await page.screenshot({ path: file });
      console.log(file);
    } else if (op === "--tap") {
      await page.getByText(arg, { exact: true }).click();
      clock = Date.now(); // waits after a tap are relative to the tap
    } else if (op === "--tapxy") {
      const [x, y] = arg.split(",").map(Number);
      await page.mouse.click(x, y);
      clock = Date.now();
    }
  }
} finally {
  await browser.close();
}
