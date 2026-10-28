const DEFAULT_MAX_CALLS_PER_HOUR = Number.parseInt(process.env.AI_MAX_CALLS_PER_HOUR ?? "500", 10);
const WINDOW_MS = 60 * 60 * 1000;

let windowStartedAt = Date.now();
let calls = 0;
let maxCalls = DEFAULT_MAX_CALLS_PER_HOUR;

export function configureAiBudget({ maxCallsPerHour = DEFAULT_MAX_CALLS_PER_HOUR, now = Date.now() } = {}) {
  if (!Number.isInteger(maxCallsPerHour) || maxCallsPerHour < 1) {
    throw new TypeError("maxCallsPerHour must be a positive integer");
  }
  maxCalls = maxCallsPerHour;
  windowStartedAt = now;
  calls = 0;
}

export function tryAcquireAiCall(now = Date.now()) {
  if (now - windowStartedAt >= WINDOW_MS || now < windowStartedAt) {
    windowStartedAt = now;
    calls = 0;
  }
  if (calls >= maxCalls) return false;
  calls += 1;
  return true;
}

export function aiBudgetMiddleware(_req, res, next) {
  if (!tryAcquireAiCall()) {
    return res.status(503).json({ error: "AI service is temporarily unavailable. Please try again later." });
  }
  next();
}

export function getAiBudgetState() {
  return { calls, maxCalls, windowStartedAt };
}
