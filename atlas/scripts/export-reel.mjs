import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const value = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
if (args.includes("--help")) {
  console.log("npm run export -- --field unconditionallove --cut discovery|atlas|pure|all [--fps 30] [--output-dir exports]");
  process.exit(0);
}

const aliases = { joy: "unconditionallove", unconditionalLove: "unconditionallove" };
const requestedField = value("field", "unconditionallove");
const field = aliases[requestedField] ?? requestedField;
const requestedCut = value("cut", "discovery");
const fps = Number(value("fps", "30"));
const requestedOutputDir = value("output-dir", "exports");
const cuts = requestedCut === "all" ? ["discovery", "atlas", "pure"] : [requestedCut];
const durations = { discovery: 7, atlas: 12, pure: 6 };
// Each tone follows the Atlas score itself: Courage 200 Hz, Neutrality
// 250 Hz, Reason 400 Hz, and so on. A quiet octave and fifth keep the bed
// musical without obscuring audio that may later be added in Instagram.
const frequencies = {
  shame: 20, guilt: 30, apathy: 50, grief: 75, fear: 100, desire: 125,
  anger: 150, pride: 175, courage: 200, neutrality: 250, willingness: 310,
  acceptance: 350, reason: 400, love: 500, unconditionallove: 540,
  peace: 600, enlightenment: 700,
};
const chromePaths = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
];

if (!Number.isFinite(fps) || fps < 24 || fps > 60) throw new Error("--fps must be between 24 and 60 for production export");
for (const cut of cuts) if (!(cut in durations)) throw new Error(`Unknown cut: ${cut}`);

const run = (command, commandArgs, options = {}) => new Promise((resolvePromise, reject) => {
  const child = spawn(command, commandArgs, { stdio: "inherit", ...options });
  child.once("error", reject);
  child.once("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`${command} exited with ${code}`)));
});

const waitForServer = async (url) => {
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error("Vite did not start in time");
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(root, requestedOutputDir);
await mkdir(outputDir, { recursive: true });
const port = 4178;
const server = spawn(join(root, "node_modules/.bin/vite"), ["--host", "127.0.0.1", "--port", String(port)], { cwd: root, stdio: "ignore" });

let browser;
try {
  await waitForServer(`http://127.0.0.1:${port}`);
  const executablePath = chromePaths.find((path) => existsSync(path));
  if (!executablePath) throw new Error("Google Chrome or Brave Browser is required");
  browser = await chromium.launch({ executablePath, headless: true, args: ["--enable-webgl", "--ignore-gpu-blocklist"] });

  for (const cut of cuts) {
    const duration = durations[cut];
    const frameCount = duration * fps;
    const frames = await mkdtemp(join(tmpdir(), `selfinder-${cut}-`));
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const url = `http://127.0.0.1:${port}/?field=${encodeURIComponent(field)}&format=reel&cut=${cut}&export=1`;
    console.log(`Rendering ${field} / ${cut}: ${frameCount} frames at ${fps} fps`);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);

    for (let frame = 0; frame < frameCount; frame++) {
      await page.evaluate((seconds) => window.__SELFINDER_RENDER_FRAME__(seconds), frame / fps);
      await page.screenshot({ path: join(frames, `frame-${String(frame).padStart(5, "0")}.png`), animations: "allow" });
      if (frame % fps === 0) process.stdout.write(`${Math.round(frame / frameCount * 100)}% `);
    }
    process.stdout.write("100%\n");
    const output = join(outputDir, `${field}-${cut}.mp4`);
    const hz = frequencies[field] ?? 200;
    const tone = `aevalsrc=0.038*sin(2*PI*${hz}*t)+0.012*sin(2*PI*${hz * 1.5}*t)+0.008*sin(2*PI*${hz * 2}*t):s=48000:d=${duration}`;
    await run("ffmpeg", [
      "-y", "-framerate", String(fps), "-i", join(frames, "frame-%05d.png"),
      "-f", "lavfi", "-i", tone,
      "-filter:a", `afade=t=in:st=0:d=1.2,afade=t=out:st=${Math.max(0, duration - 1.5)}:d=1.5,aformat=channel_layouts=stereo`,
      "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", output,
    ]);
    await page.close();
    await rm(frames, { recursive: true, force: true });
    console.log(`Created ${output}`);
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
