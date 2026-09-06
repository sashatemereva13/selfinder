import { useLocaleStore } from '../store/localeStore';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

// Carries the real HTTP status alongside the backend's human-readable
// message (see the !res.ok branch below) — added 2026-09-06 so a 401
// caused by an EXPIRED/invalid token (auth.js's requireAuth) can be told
// apart from any other failure without string-matching the message
// itself, which would be both fragile and locale-dependent. See
// handleExpiredSession below, the actual consumer of `status`.
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Shown when fetch() itself throws — i.e. the request never reached the
// server at all (DNS failure, connection refused, a VPN routing traffic
// somewhere selfinder.online's host rejects). Confirmed on a real device:
// the raw error surfaced as "fetch failed: java.net.ConnectException:
// Failed to connect to selfinder.online / 72.60.88.91:43" — a Java
// exception with the backend's literal IP and port, shown directly to the
// user via setError(err.message) in every caller. That's both confusing
// (nobody knows what a ConnectException is) and a real information leak
// (the server's IP has no business being user-visible) for a failure mode
// that in practice is almost always "a VPN is interfering," not something
// the person can fix by reading a stack trace. This replaces that raw
// message with an actionable, locale-aware one instead.
const CONNECTION_ERROR_MESSAGE = {
  en: "Couldn't connect. If you're using a VPN, try turning it off — Selfinder works in every country.",
  ru: 'Не удалось подключиться. Если вы используете VPN, попробуйте его отключить — НАЙТИСЬ работает в любой стране.',
};

// fetch() on React Native has NO default timeout — confirmed as a real,
// systemic gap (2026-08-14: the account-export button got stuck on "…"
// forever on a real device; the device's own system log showed a
// connection starting to set up and then nothing further — no success,
// no error, no follow-up log line at all). Without an explicit timeout, a
// genuinely stalled connection (a slow DNS resolver, exactly what that
// log showed) means the request's own await never settles either way, so
// try/catch/finally around it never completes and a caller's "loading"
// state is stuck permanently. 15s is generous enough for a normal slow
// connection, short enough that a real stall doesn't read as the app
// being frozen for an unbounded amount of time.
const REQUEST_TIMEOUT_MS = 15000;
const TIMEOUT_ERROR_MESSAGE = {
  en: "That's taking too long. Check your connection and try again.",
  ru: 'Это занимает слишком много времени. Проверьте соединение и попробуйте снова.',
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  token?: string | null;
  timeoutMs?: number;
}

async function request<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? (body !== undefined ? 'POST' : 'GET');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const locale = useLocaleStore.getState().locale;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(TIMEOUT_ERROR_MESSAGE[locale] ?? TIMEOUT_ERROR_MESSAGE.en);
    }
    // fetch() itself threw for some other reason — the request never got
    // a response at all, so there's no res.status/res.text() to inspect.
    // See the comment on CONNECTION_ERROR_MESSAGE above for why this
    // needs its own message rather than letting the raw thrown error
    // propagate.
    throw new Error(CONNECTION_ERROR_MESSAGE[locale] ?? CONNECTION_ERROR_MESSAGE.en);
  } finally {
    clearTimeout(timeoutId);
  }
  if (!res.ok) {
    // The backend's error responses are already human-readable ({"error":
    // "Username already taken"}, etc — see authController.js) — every
    // caller in the app displays err.message directly to the user (e.g.
    // AccountSection.tsx's setError(err.message)), so this has to extract
    // that string rather than wrap it in debug-style "API /path 409: ..."
    // formatting, which is what was happening before and is not something
    // a user should ever see.
    const text = await res.text().catch(() => '');
    let message = res.statusText || `Something went wrong (${res.status})`;
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed?.error === 'string' && parsed.error) message = parsed.error;
      } catch {
        // Non-JSON error body (e.g. a proxy/HTML error page) — fall back
        // to the generic message above rather than showing raw HTML/text.
      }
    }
    const err = new ApiError(message, res.status);
    // A 401 specifically caused by a token that was actually SENT (not
    // just "no token, anonymous request") means the stored session is
    // dead — expired (backend/controllers/authController.js signs tokens
    // with a 7-day expiry, and there's no refresh mechanism) or otherwise
    // rejected by the server. Before this fix, authStore's session object
    // just stayed populated forever in that case (nothing ever cleared
    // it), so the app kept believing it was signed in while every
    // authenticated call — arcLine, Spill, wishes, crossings, journeys —
    // silently failed with "Token invalid or expired" logged to the
    // console and nothing shown to the user (confirmed live 2026-09-06:
    // every one of those calls failing at once, all with this exact
    // message, is the signature of this bug, not five separate broken
    // endpoints). Calling logout() here makes a dead session self-heal
    // into "signed out" — which the app already handles correctly
    // (_layout.tsx redirects to onboarding) — instead of limping along
    // silently broken. Dynamic import avoids a require cycle (authStore
    // itself calls into several *Api modules that go through this file).
    if (res.status === 401 && options.token) {
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
    }
    throw err;
  }
  return res.json() as Promise<T>;
}

export default request;
