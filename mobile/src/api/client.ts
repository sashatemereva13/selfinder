const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  token?: string | null;
}

async function request<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? (body !== undefined ? 'POST' : 'GET');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
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
