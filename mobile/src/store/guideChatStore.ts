import { create } from 'zustand';
import { sendMessage, ChatCompletionMessage } from '../api/chat';
import { saveConversationIfConsented } from '../api/conversation';
import { Philosopher } from '../types';
import { track } from '../utils/analytics';
import { ensureAIConsent } from './aiDisclosureStore';

// Mirrors web's ChatContext.jsx: in-memory only, no persistence — resets on
// app restart. Keyed by philosopher id so switching your guide (via the You
// tab) keeps each philosopher's history separate rather than overwriting it.
// Server-side persistence (Selfinder+) rides on top of this same in-memory
// state rather than replacing it — see `flushPendingSave`.
interface GuideChatStore {
  conversations: Record<string, ChatCompletionMessage[]>;
  isLoading: boolean;
  // The MeasureResult a philosopher's *next* saved conversation should link
  // to, if any — set when a reading joins the conversation, cleared
  // once consumed by the first save. Per-philosopher because "Talk about
  // it" always targets whichever philosopher is currently chosen.
  pendingMeasureResultId: Record<string, string | null>;
  // How many messages were already saved server-side for this philosopher,
  // last time a save happened — lets flushPendingSave skip re-saving an
  // unchanged conversation when the Guide screen is merely revisited.
  lastSavedMessageCount: Record<string, number>;
  // What the philosopher needs to know about the reading this conversation
  // is currently about (level, spheres, axis) — appended to the system
  // prompt on every send while set, since the reflection message alone
  // only carries what was said, not the reading's own details. Replaces
  // the old scripted "I just measured myself: …" opener, which carried
  // those details by putting words in the person's mouth.
  readingContext: Record<string, string | null>;
  // additionalContext is appended to the philosopher's system prompt for
  // this one exchange only — never shown as a chat bubble. Used so a
  // sphere-specific "Talk about it" (see Depths) can hand the philosopher
  // the person's own Measure answer for that sphere, so the first reply
  // can speak to their specific situation instead of the generic level
  // description — the visible message stays a clean, human line.
  send: (philosopher: Philosopher, text: string, additionalContext?: string) => Promise<void>;
  // The philosopher's first line from onboarding's meet step, so the
  // conversation starts where the person first heard them — only if
  // nothing is there yet.
  seedOpening: (philosopherId: string, content: string) => void;
  // A finished Measure reading joins the conversation: its reflection (if
  // one was generated) as the philosopher's latest message, and its
  // details as readingContext. Idempotent per reading (keyed by savedAt),
  // so Measure finishing and a later "Talk about it" can both call it.
  addReading: (
    philosopherId: string,
    reading: { savedAt: string; reflection: string | null; context: string; measureResultId?: string | null }
  ) => void;
  clearConversation: (philosopherId: string) => void;
  resetAll: () => void;
  setPendingMeasureResultId: (philosopherId: string, measureResultId: string | null | undefined) => void;
  // Best-effort save of a philosopher's current conversation, called when
  // leaving the Guide screen (tab blur) — not on every message, since Groq
  // replies already stream independently of persistence and saving on
  // every turn would be a needless save storm.
  flushPendingSave: (philosopherId: string) => void;
}

export const useGuideChatStore = create<GuideChatStore>((set, get) => ({
  conversations: {},
  isLoading: false,
  pendingMeasureResultId: {},
  lastSavedMessageCount: {},
  readingContext: {},

  send: async (philosopher, text, additionalContext) => {
    const trimmed = text.trim();
    if (!trimmed || get().isLoading) return;
    // Asked before the message is added, so "Not now" leaves the
    // conversation exactly as it was rather than holding an unanswered
    // message.
    if (!(await ensureAIConsent())) return;

    const existing = get().conversations[philosopher.id] ?? [];
    const withUserMessage = [...existing, { role: 'user' as const, content: trimmed }];

    set((state) => ({
      conversations: { ...state.conversations, [philosopher.id]: withUserMessage },
      isLoading: true,
    }));
    track('guide_message_sent');

    try {
      const context = [get().readingContext[philosopher.id], additionalContext].filter(Boolean).join('\n\n');
      const { reply, suggestSpill } = await sendMessage(withUserMessage, philosopher, context);
      set((state) => ({
        conversations: {
          ...state.conversations,
          [philosopher.id]: [
            ...withUserMessage,
            { role: 'assistant', content: reply, suggestSpill },
          ],
        },
        isLoading: false,
      }));
    } catch (err) {
      console.error('Guide chat message failed:', err);
      set({ isLoading: false });
    }
  },

  seedOpening: (philosopherId, content) => {
    if ((get().conversations[philosopherId] ?? []).length > 0) return;
    set((state) => ({
      conversations: { ...state.conversations, [philosopherId]: [{ role: 'assistant', content }] },
    }));
  },

  addReading: (philosopherId, { savedAt, reflection, context, measureResultId }) => {
    const existing = get().conversations[philosopherId] ?? [];
    const alreadyThere = existing.some((m) => m.readingAt === savedAt);
    set((state) => ({
      conversations:
        reflection && !alreadyThere
          ? {
              ...state.conversations,
              [philosopherId]: [...existing, { role: 'assistant', content: reflection, readingAt: savedAt }],
            }
          : state.conversations,
      readingContext: { ...state.readingContext, [philosopherId]: context },
      pendingMeasureResultId: { ...state.pendingMeasureResultId, [philosopherId]: measureResultId ?? null },
    }));
  },

  clearConversation: (philosopherId) => {
    set((state) => ({
      conversations: { ...state.conversations, [philosopherId]: [] },
      lastSavedMessageCount: { ...state.lastSavedMessageCount, [philosopherId]: 0 },
      readingContext: { ...state.readingContext, [philosopherId]: null },
    }));
  },

  // Used on sign-out/account-switch (see authStore.ts) so the next
  // session never sees the previous account's conversations.
  resetAll: () => set({ conversations: {}, pendingMeasureResultId: {}, lastSavedMessageCount: {}, readingContext: {} }),

  setPendingMeasureResultId: (philosopherId, measureResultId) => {
    set((state) => ({
      pendingMeasureResultId: { ...state.pendingMeasureResultId, [philosopherId]: measureResultId ?? null },
    }));
  },

  flushPendingSave: (philosopherId) => {
    const state = get();
    const messages = state.conversations[philosopherId] ?? [];
    const alreadySaved = state.lastSavedMessageCount[philosopherId] ?? 0;
    if (messages.length === 0 || messages.length === alreadySaved) return;

    const measureResultId = state.pendingMeasureResultId[philosopherId] ?? null;
    set((s) => ({
      lastSavedMessageCount: { ...s.lastSavedMessageCount, [philosopherId]: messages.length },
      pendingMeasureResultId: { ...s.pendingMeasureResultId, [philosopherId]: null },
    }));
    // Fire-and-forget — saveConversationIfConsented already swallows its
    // own errors and no-ops without consent, matching the best-effort
    // pattern used everywhere else new persistence was added this session.
    saveConversationIfConsented(philosopherId, messages, measureResultId);
  },
}));
