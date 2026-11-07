import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { aiBudgetMiddleware } from "../utils/aiBudget.js";

const WINDOW_MS = 60 * 1000;

function getAccountKey(req) {
  return req.user?.id ? `account:${req.user.id}` : null;
}

export function createAiRateLimiter({ limit, message, windowMs = WINDOW_MS, keyByAccount = true }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => (keyByAccount ? getAccountKey(req) : null) ?? ipKeyGenerator(req.ip),
    handler: (_req, res) => res.status(429).json({ error: message }),
  });
}

// AI calls that do not need a paid account are deliberately capped more
// tightly. Authenticated calls share a per-account ceiling; anonymous calls
// fall back to the source IP. Configure Express proxy trust narrowly in the
// deployment before relying on IP-based limits.
export const publicAiLimiter = createAiRateLimiter({
  limit: 10,
  message: "Too many AI requests. Please wait and try again.",
});

export const globalAiLimiter = createAiRateLimiter({
  limit: 60,
  message: "Too many AI requests. Please wait and try again.",
});

export const accountAiLimiter = createAiRateLimiter({
  limit: 30,
  message: "Too many AI requests. Please wait and try again.",
});

export const expensiveAiLimiter = createAiRateLimiter({
  limit: 5,
  message: "Too many requests for this feature. Please wait and try again.",
});

export const accountExpensiveAiLimiter = createAiRateLimiter({
  limit: 5,
  message: "Too many requests for this feature. Please wait and try again.",
});

export const publicExpensiveAiLimiter = createAiRateLimiter({
  limit: 3,
  message: "Too many requests for this feature. Please wait and try again.",
});

export const eventsRateLimiter = createAiRateLimiter({
  limit: 30,
  message: "Too many analytics events. Please wait and try again.",
});

export const passwordResetRequestLimiter = createAiRateLimiter({
  limit: 5,
  windowMs: 60 * 60 * 1000,
  keyByAccount: false,
  message: "Too many password reset requests. Please try again later.",
});

export const passwordResetSubmitLimiter = createAiRateLimiter({
  limit: 20,
  windowMs: 60 * 60 * 1000,
  keyByAccount: false,
  message: "Too many reset attempts. Please try again later.",
});

// Login and sign-up (2026-11-07). Two login limits, because the two attacks
// look different: one IP trying many accounts (credential stuffing) hits the
// per-IP limit; many IPs trying one account (guessing a password) hit the
// per-username one. The per-username limit only counts failed attempts, so
// someone who signs in normally never meets it — and it's short, so an
// attacker can't lock a real person out for long by failing on purpose.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function usernameKey(req) {
  const username = req.body?.username;
  return typeof username === "string" ? `login:${username.trim().toLowerCase()}` : "login:invalid";
}

export const loginIpLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: (_req, res) => res.status(429).json({ error: "Too many sign-in attempts. Please wait a few minutes." }),
});

export const loginAccountLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: usernameKey,
  handler: (_req, res) => res.status(429).json({ error: "Too many sign-in attempts. Please wait a few minutes." }),
});

export const registerLimiter = createAiRateLimiter({
  limit: 10,
  windowMs: 60 * 60 * 1000,
  keyByAccount: false,
  message: "Too many new accounts from here. Please try again later.",
});

// Baseline for every /api request (2026-11-07), in front of the stricter
// per-feature limits. Every signed-in request now reads the account from the
// database (middleware/auth.js), so without this anyone could turn requests
// into database load at whatever rate they like. Keyed by IP because it runs
// before sign-in is known. Generous on purpose: phones on mobile networks
// often share one public IP, and the app makes several calls per screen.
export const apiBaselineLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: (_req, res) => res.status(429).json({ error: "Too many requests. Please wait a moment." }),
});

export { aiBudgetMiddleware };

export function hasValidAiPayload(req, res, next) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "A JSON object is required" });
  }
  next();
}

export function textWithin(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

export function validLocale(locale) {
  return locale === undefined || locale === "en" || locale === "ru";
}
