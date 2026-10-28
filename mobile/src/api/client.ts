import { useLocaleStore } from '../store/localeStore';
import * as SecureStore from 'expo-secure-store';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

// The only errors whose text may ever reach the screen (2026-10-21): what
// a person sees is always one of the messages written in this file, never
// the server's own wording, a stack trace, or a library's message — those
// can leak internals (an IP, a field name, a validation rule's shape).
// Callers show `errorText(err, fallback)`, which falls back for anything
// that isn't a SafeError.
export class SafeError extends Error {}

export function errorText(err: unknown, fallback: string): string {
  return err instanceof SafeError ? err.message : fallback;
}

// Carries the HTTP status alongside the safe message, so a dead session
// (401 on a request that sent a token) can be told apart from any other
// failure without matching on text.
export class ApiError extends SafeError {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Localized = { en: string; ru: string };

// The server's messages a person can act on, each with its own wording in
// both languages. Anything not here gets a generic message by status.
const KNOWN_ERRORS: Record<string, Localized> = {
  'Invalid credentials': {
    en: "That username and password don't match.",
    ru: 'Имя пользователя и пароль не совпадают.',
  },
  'username and password are required': {
    en: 'Enter a username and password.',
    ru: 'Введите имя пользователя и пароль.',
  },
  'Username already taken': { en: 'That username is taken.', ru: 'Это имя пользователя уже занято.' },
  'Email already in use': {
    en: 'That email is already used by another account.',
    ru: 'Этот email уже используется другим аккаунтом.',
  },
  'Password must be at least 8 characters': {
    en: 'The password needs at least 8 characters.',
    ru: 'Пароль должен быть не короче 8 символов.',
  },
  'New password must be at least 8 characters': {
    en: 'The new password needs at least 8 characters.',
    ru: 'Новый пароль должен быть не короче 8 символов.',
  },
  "That doesn't look like a valid email": {
    en: "That doesn't look like a valid email.",
    ru: 'Похоже, это неверный email.',
  },
  'A valid email is required': { en: "That doesn't look like a valid email.", ru: 'Похоже, это неверный email.' },
  'You must accept the privacy policy to create an account': {
    en: 'To create an account, accept the privacy policy.',
    ru: 'Чтобы создать аккаунт, примите политику конфиденциальности.',
  },
  'Current password is incorrect': {
    en: "The current password isn't right.",
    ru: 'Текущий пароль неверный.',
  },
  'Invalid or expired code': {
    en: "That code isn't right, or it has expired.",
    ru: 'Код неверный или устарел.',
  },
  'Too many attempts — request a new code': {
    en: 'Too many attempts. Request a new code.',
    ru: 'Слишком много попыток. Запросите новый код.',
  },
};
const SESSION_ENDED: Localized = {
  en: 'Your sign-in has ended. Sign in again to keep saving.',
  ru: 'Вход истёк. Войдите снова, чтобы продолжить сохранять.',
};
const TOO_MANY: Localized = {
  en: 'Too many tries just now. Wait a moment and try again.',
  ru: 'Слишком много попыток. Подождите немного и попробуйте снова.',
};
const GENERIC: Localized = {
  en: 'Something went wrong. Try again.',
  ru: 'Что-то пошло не так. Попробуйте ещё раз.',
};

function safeMessage(status: number, serverMessage: string | null, sentToken: boolean): string {
  const locale = useLocaleStore.getState().locale;
  const pick = (m: Localized) => m[locale] ?? m.en;
  if (status === 401 && sentToken) return pick(SESSION_ENDED);
  if (serverMessage && KNOWN_ERRORS[serverMessage]) return pick(KNOWN_ERRORS[serverMessage]);
  if (status === 429) return pick(TOO_MANY);
  return pick(GENERIC);
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
  // 'PATCH' added 2026-09-13 for wish.ts's own setWishWoop (adding WOOP
  // to an already-saved wish) — the first caller in this codebase to
  // need a real partial-update semantic distinct from POST's "create/act"
  // or DELETE's own meaning.
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string | null;
  timeoutMs?: number;
  aiConsent?: boolean;
}

async function request<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? (body !== undefined ? 'POST' : 'GET');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.aiConsent) {
    try {
      const consent = await SecureStore.getItemAsync('selfinder_ai_processing_consent_grant');
      if (consent) headers['X-AI-Consent'] = consent;
    } catch {
      // Server rejects the request if the grant isn't available.
    }
  }

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
      throw new SafeError(TIMEOUT_ERROR_MESSAGE[locale] ?? TIMEOUT_ERROR_MESSAGE.en);
    }
    // fetch() itself threw for some other reason — the request never got
    // a response at all, so there's no res.status/res.text() to inspect.
    // See the comment on CONNECTION_ERROR_MESSAGE above for why this
    // needs its own message rather than letting the raw thrown error
    // propagate.
    throw new SafeError(CONNECTION_ERROR_MESSAGE[locale] ?? CONNECTION_ERROR_MESSAGE.en);
  } finally {
    clearTimeout(timeoutId);
  }
  if (!res.ok) {
    // The server's own wording is read only to choose which safe message
    // to show (see KNOWN_ERRORS) — it never reaches the screen itself.
    const text = await res.text().catch(() => '');
    let serverMessage: string | null = null;
    let serverCode: string | null = null;
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed?.error === 'string') serverMessage = parsed.error;
        if (typeof parsed?.code === 'string') serverCode = parsed.code;
      } catch {
        // Non-JSON body (a proxy's HTML error page) — nothing to read.
      }
    }
    if (res.status === 403 && serverCode === 'AI_CONSENT_REQUIRED') {
      import('../store/aiDisclosureStore').then(({ resetAIConsent }) => resetAIConsent());
    }
    const err = new ApiError(safeMessage(res.status, serverMessage, !!options.token), res.status);
    // A 401 on a request that SENT a token means that sign-in has ended
    // (expired, or the account is gone). It only clears the sign-in —
    // nothing on the phone is wiped, the app stays where it is
    // (2026-10-21; it used to log out fully, wiping the philosopher and
    // sending the person back to onboarding). The token is passed so a
    // late reply to an old token can't end a newer sign-in. Dynamic
    // import avoids a require cycle (authStore calls into *Api modules
    // that go through this file).
    if (res.status === 401 && options.token) {
      const sentToken = options.token;
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().expire(sentToken);
      });
    }
    throw err;
  }
  return res.json() as Promise<T>;
}

export default request;
