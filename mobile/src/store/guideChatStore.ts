import { create } from 'zustand';
import { sendMessage, ChatCompletionMessage } from '../api/chat';
import { saveConversationIfConsented } from '../api/conversation';
import { Philosopher } from '../types';
import { track } from '../utils/analytics';

// Mirrors web's ChatContext.jsx: in-memory only, no persistence — resets on
// app restart. Keyed by philosopher id so switching your guide (via the You
// tab) keeps each philosopher's history separate rather than overwriting it.
// Server-side persistence (Selfinder+) rides on top of this same in-memory
// state rather than replacing it — see `flushPendingSave`.
interface GuideChatStore {
  conversations: Record<string, ChatCompletionMessage[]>;
  isLoading: boolean;
  // The MeasureResult a philosopher's *next* saved conversation should link
  // to, if any — set right before sending a "Talk about it" opener, cleared
  // once consumed by the first save. Per-philosopher because "Talk about
  // it" always targets whichever philosopher is currently chosen.
  pendingMeasureResultId: Record<string, string | null>;
  // How many messages were already saved server-side for this philosopher,
  // last time a save happened — lets flushPendingSave skip re-saving an
  // unchanged conversation when the Guide screen is merely revisited.
  lastSavedMessageCount: Record<string, number>;
  // additionalContext is appended to the philosopher's system prompt for
  // this one exchange only — never shown as a chat bubble. Used so a
  // sphere-specific "Talk about it" (see Depths) can hand the philosopher
  // the person's own Measure answer for that sphere, so the first reply
  // can speak to their specific situation instead of the generic level
  // description — the visible message stays a clean, human line.
  send: (philosopher: Philosopher, text: string, additionalContext?: string) => Promise<void>;
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

  send: async (philosopher, text, additionalContext) => {
    const trimmed = text.trim();
    if (!trimmed || get().isLoading) return;

    const existing = get().conversations[philosopher.id] ?? [];
    const withUserMessage = [...existing, { role: 'user' as const, content: trimmed }];

    set((state) => ({
      conversations: { ...state.conversations, [philosopher.id]: withUserMessage },
      isLoading: true,
    }));
    track('guide_message_sent');

    try {
      const { reply, suggestSpill } = await sendMessage(withUserMessage, philosopher, additionalContext);
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

  clearConversation: (philosopherId) => {
    set((state) => ({
      conversations: { ...state.conversations, [philosopherId]: [] },
      lastSavedMessageCount: { ...state.lastSavedMessageCount, [philosopherId]: 0 },
    }));
  },

  // Dev/testing only — see the "Reset onboarding state" button in the You tab.
  resetAll: () => set({ conversations: {}, pendingMeasureResultId: {}, lastSavedMessageCount: {} }),

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
