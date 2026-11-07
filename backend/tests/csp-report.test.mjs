import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { readFileSync } from "node:fs";
import cspReportRouter from "../routes/cspReport.js";
import { register } from "../metrics.js";

async function withServer(fn) {
  const app = express();
  const logged = [];
  app.use((req, _res, next) => { req.log = { warn: (obj) => logged.push(obj) }; next(); });
  app.use("/api/csp-report", cspReportRouter);
  const server = app.listen(0);
  try {
    await fn(`http://127.0.0.1:${server.address().port}/api/csp-report`, logged);
  } finally {
    server.close();
  }
}

test("a browser CSP report is logged with only bounded, non-personal fields", async () => {
  await withServer(async (url, logged) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/csp-report" },
      body: JSON.stringify({ "csp-report": {
        "document-uri": "https://selfinder.online/journal?entry=my-secret-text",
        "effective-directive": "script-src-elem",
        "blocked-uri": "https://evil.example/x.js?token=abc",
        "script-sample": "what the person typed",
      } }),
    });
    assert.equal(res.status, 204);
    assert.deepEqual(logged[0].csp, { directive: "script-src-elem", blocked: "https://evil.example", page: "/journal" });
    assert.ok(!JSON.stringify(logged).includes("what the person typed"));
    assert.ok(!JSON.stringify(logged).includes("token=abc"));
  });
});

test("an attacker-chosen directive can't create new metric series", async () => {
  await withServer(async (url) => {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/csp-report" },
      body: JSON.stringify({ "csp-report": { "effective-directive": "made-up-" + Math.random() } }),
    });
    const metrics = await register.getMetricsAsJSON();
    const labels = metrics.find((m) => m.name === "csp_violations_total").values.map((v) => v.labels.directive);
    assert.ok(labels.every((d) => d === "other" || d.endsWith("-src") || d.endsWith("-src-elem") || /^[a-z-]+$/.test(d)));
    assert.ok(labels.includes("other"));
  });
});

test("oversized reports are refused", async () => {
  await withServer(async (url) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/csp-report" },
      body: JSON.stringify({ "csp-report": { pad: "x".repeat(20000) } }),
    });
    assert.equal(res.status, 413);
  });
});

test("Express doesn't announce itself", () => {
  assert.match(readFileSync("server.js", "utf8"), /app\.disable\("x-powered-by"\)/);
});
