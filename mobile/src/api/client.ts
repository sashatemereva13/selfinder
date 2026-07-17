const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${path} ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export default request;
