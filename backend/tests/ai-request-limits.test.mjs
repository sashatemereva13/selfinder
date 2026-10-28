import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import { createAiRateLimiter, textWithin } from "../middleware/aiRequestLimits.js";
import { aiBudgetMiddleware, configureAiBudget, tryAcquireAiCall } from "../utils/aiBudget.js";

async function withServer(app, run) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
}

test("request parser rejects JSON bodies above the configured limit", async () => {
  const app = express();
  app.use(express.json({ limit: "128b" }));
  app.post("/", (_req, res) => res.json({ ok: true }));
  app.use((err, _req, res, _next) => res.status(err.status ?? 500).json({ error: "rejected" }));

  await withServer(app, async (base) => {
    const response = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "x".repeat(256) }),
    });
    assert.equal(response.status, 413);
  });
});

test("AI limiter returns 429 after the configured request count", async () => {
  const app = express();
  app.set("trust proxy", false);
  app.use(createAiRateLimiter({ limit: 1, message: "limited" }));
  app.get("/", (_req, res) => res.json({ ok: true }));

  await withServer(app, async (base) => {
    assert.equal((await fetch(base)).status, 200);
    const limited = await fetch(base);
    assert.equal(limited.status, 429);
    assert.deepEqual(await limited.json(), { error: "limited" });
  });
});

test("input validator rejects text beyond the endpoint bound", () => {
  assert.equal(textWithin("hello", 5), true);
  assert.equal(textWithin("x".repeat(6), 5), false);
  assert.equal(textWithin("  ", 5), false);
});

test("AI budget circuit breaker blocks calls after its hourly ceiling", () => {
  configureAiBudget({ maxCallsPerHour: 1, now: 10_000 });
  assert.equal(tryAcquireAiCall(10_001), true);
  assert.equal(tryAcquireAiCall(10_002), false);
  assert.equal(tryAcquireAiCall(10_000 + 60 * 60 * 1000), true);
});

test("AI budget middleware rejects provider-bound work after ceiling", async () => {
  configureAiBudget({ maxCallsPerHour: 1 });
  assert.equal(tryAcquireAiCall(), true);
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  aiBudgetMiddleware({}, response, () => assert.fail("next must not run when budget is exhausted"));
  assert.equal(response.statusCode, 503);
});

test("AI endpoints and strict JSON parser are wired into server configuration", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../server.js", import.meta.url), "utf8");
  assert.match(source, /express\.json\(\{\s*limit:\s*["']64kb["']/);
  for (const path of ["chat", "measure", "crossing", "arc-line", "journeys"]) {
    assert.match(source, new RegExp(`app\\.use\\\\?\\(["']\\/api\\/${path}`));
  }
});
