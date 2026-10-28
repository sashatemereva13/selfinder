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
