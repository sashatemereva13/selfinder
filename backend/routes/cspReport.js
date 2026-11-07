import express, { Router } from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { cspViolationsTotal, CSP_DIRECTIVES } from "../metrics.js";

// Where browsers send Content-Security-Policy violation reports (2026-11-07).
// The policy ships as Report-Only first: nothing is blocked, and every
// resource the policy *would* have blocked arrives here. Once a week or two
// of real traffic shows only expected reports, the same policy is switched
// to enforcing (see terraform/nginx/selfinder.conf).
//
// Anyone can post here — browsers send these without credentials — so it
// is treated as untrusted input: small body, rate-limited, and only a few
// bounded fields are kept. `script-sample` is never logged: it can contain
// a fragment of whatever was on the page, including what someone typed.

const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: (_req, res) => res.status(204).end(),
});

const parseReport = express.json({
  type: ["application/csp-report", "application/reports+json", "application/json"],
  limit: "8kb",
});

function directiveOf(report) {
  const raw = String(report["effective-directive"] ?? report["violated-directive"] ?? "")
    .trim().split(/\s+/)[0].toLowerCase();
  return CSP_DIRECTIVES.includes(raw) ? raw : "other";
}

// "inline", "eval", "data", "blob", or just the origin of a URL — never the
// full URL, whose path or query could carry something personal.
function blockedOf(report) {
  const raw = String(report["blocked-uri"] ?? report.blockedURL ?? "");
  if (/^(inline|eval|data|blob|self|wasm-eval|trusted-types-sink)$/i.test(raw)) return raw.toLowerCase();
  try { return new URL(raw).origin; } catch { return raw ? "unparseable" : "none"; }
}

function pathOf(report) {
  try { return new URL(String(report["document-uri"] ?? report.documentURL ?? "")).pathname.slice(0, 200); }
  catch { return null; }
}

router.post("/", limiter, parseReport, (req, res) => {
  // report-uri sends { "csp-report": {...} }; the Reporting API sends [{ body: {...} }].
  const reports = Array.isArray(req.body)
    ? req.body.slice(0, 10).map((entry) => entry?.body).filter(Boolean)
    : [req.body?.["csp-report"]].filter(Boolean);

  for (const report of reports) {
    if (typeof report !== "object") continue;
    const directive = directiveOf(report);
    cspViolationsTotal.inc({ directive });
    req.log?.warn({ csp: { directive, blocked: blockedOf(report), page: pathOf(report) } }, "CSP violation");
  }
  res.status(204).end();
});

export default router;
