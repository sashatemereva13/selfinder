#!/usr/bin/env node
// Dependency gate for CI (Session D, rung 4): fails the build when a
// production dependency has a known vulnerability of severity high or
// critical — unless it's listed in .github/audit-exceptions.json with a
// reason, an owner and an expiry date.
//
// Why exceptions exist at all: a gate that blocks on something nobody can
// fix today (no patched version yet, or the vulnerable code is never
// reached) gets disabled. A dated exception keeps the gate on while being
// honest about the gap — and an expired one fails the build again, so it
// can't quietly become permanent.
//
// Usage: node scripts/audit-gate.mjs <package-dir>

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = process.argv[2];
if (!packageDir) {
  console.error("usage: node scripts/audit-gate.mjs <package-dir>");
  process.exit(2);
}

const BLOCKING = new Set(["high", "critical"]);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exceptions = JSON.parse(readFileSync(resolve(root, ".github/audit-exceptions.json"), "utf8")).exceptions ?? [];
const today = new Date().toISOString().slice(0, 10);

let report;
try {
  report = execFileSync("npm", ["audit", "--omit=dev", "--json"], { cwd: resolve(root, packageDir), encoding: "utf8" });
} catch (err) {
  // npm audit exits non-zero when it finds anything; the JSON is still on stdout.
  report = err.stdout;
}
if (!report) {
  // No report means we can't know — fail closed rather than pass silently.
  console.error(`audit-gate: npm audit produced no report for ${packageDir}`);
  process.exit(1);
}

const advisories = [];
for (const [name, vuln] of Object.entries(JSON.parse(report).vulnerabilities ?? {})) {
  for (const via of vuln.via ?? []) {
    if (typeof via === "object" && BLOCKING.has(via.severity)) {
      advisories.push({ package: name, id: String(via.url ?? via.source), title: via.title, severity: via.severity });
    }
  }
}

let failed = false;
for (const advisory of advisories) {
  const exception = exceptions.find((e) => e.package === advisory.package && advisory.id.includes(e.advisory));
  if (!exception) {
    failed = true;
    console.error(`BLOCKED  ${advisory.severity}  ${advisory.package}: ${advisory.title}\n         ${advisory.id}`);
  } else if (!(exception.expires >= today)) {
    failed = true;
    console.error(`EXPIRED  exception for ${advisory.package} (${exception.advisory}) ran out on ${exception.expires} — fix it or renew it with a new reason`);
  } else {
    console.log(`allowed  ${advisory.package} (${exception.advisory}) until ${exception.expires} — ${exception.reason} [${exception.owner}]`);
  }
}

if (failed) process.exit(1);
console.log(`audit-gate: ${packageDir} has no unexcepted high/critical production vulnerabilities`);
