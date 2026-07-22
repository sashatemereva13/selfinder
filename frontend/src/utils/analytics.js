import { apiUrl } from "../api/baseUrl";

// A stable per-browser grouping key — not a security context, so no need
// for a real UUID library. Never tied to account identity; see the privacy
// policy's analytics section.
const ANONYMOUS_ID_KEY = "sf_anonymous_id";
const FLUSH_INTERVAL_MS = 10_000;
const MAX_BATCH_SIZE = 20;

let queue = [];
let flushTimer = null;

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getAnonymousId() {
  try {
    const stored = localStorage.getItem(ANONYMOUS_ID_KEY);
    if (stored) return stored;
    const fresh = generateId();
    localStorage.setItem(ANONYMOUS_ID_KEY, fresh);
    return fresh;
  } catch {
    // localStorage unavailable — id just won't persist across sessions this time.
    return generateId();
  }
}

async function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH_SIZE);
  try {
    await fetch(apiUrl("/events"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch, anonymousId: getAnonymousId(), platform: "web" }),
    });
  } catch {
    // Best-effort — analytics should never surface an error to the user,
    // and a dropped batch isn't worth retrying.
  }
}

function ensureFlushTimer() {
  if (flushTimer) return;
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
}

export function track(name, properties) {
  queue.push({ name, properties: properties ?? null, occurredAt: new Date().toISOString() });
  ensureFlushTimer();
  if (queue.length >= MAX_BATCH_SIZE) flush();
}
