import { useLocaleStore } from '../store/localeStore';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  token?: string | null;
}

async function request<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? (body !== undefined ? 'POST' : 'GET');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch() itself threw — the request never got a response at all, so
    // there's no res.status/res.text() to inspect. See the comment on
    // CONNECTION_ERROR_MESSAGE above for why this needs its own message
    // rather than letting the raw thrown error propagate.
    const locale = useLocaleStore.getState().locale;
    throw new Error(CONNECTION_ERROR_MESSAGE[locale] ?? CONNECTION_ERROR_MESSAGE.en);
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
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export default request;
