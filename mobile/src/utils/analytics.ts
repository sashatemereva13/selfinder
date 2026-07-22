import * as SecureStore from 'expo-secure-store';
import request from '../api/client';

// A stable per-install grouping key — not a security context, so no need for
// a real UUID library. Persisted the same way every other store persists
// its identifiers.
const ANONYMOUS_ID_KEY = 'selfinder_anonymous_id';
const FLUSH_INTERVAL_MS = 10_000;
const MAX_BATCH_SIZE = 20;

interface QueuedEvent {
  name: string;
  properties?: Record<string, unknown>;
  occurredAt: string;
}

let anonymousId: string | null = null;
let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function getAnonymousId(): Promise<string> {
  if (anonymousId) return anonymousId;
  try {
    const stored = await SecureStore.getItemAsync(ANONYMOUS_ID_KEY);
    if (stored) {
      anonymousId = stored;
      return stored;
    }
  } catch {
    // SecureStore unavailable — fall through to an in-memory-only id.
  }
  const fresh = generateId();
  anonymousId = fresh;
  try {
    await SecureStore.setItemAsync(ANONYMOUS_ID_KEY, fresh);
  } catch {
    // Unavailable — the id just won't persist across restarts this time.
  }
  return fresh;
}

async function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH_SIZE);
  const id = await getAnonymousId();
  try {
    await request('/events', { events: batch, anonymousId: id, platform: 'ios' });
  } catch {
    // Best-effort — analytics should never surface an error to the user,
    // and a dropped batch isn't worth retrying or queuing durably.
  }
}

function ensureFlushTimer() {
  if (flushTimer) return;
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
}

export function track(name: string, properties?: Record<string, unknown>): void {
  queue.push({ name, properties, occurredAt: new Date().toISOString() });
  ensureFlushTimer();
  if (queue.length >= MAX_BATCH_SIZE) flush();
}
