import { create } from 'zustand';
import { sendMessage, ChatCompletionMessage } from '../api/chat';
import { Philosopher } from '../types';
import { track } from '../utils/analytics';

// Mirrors web's ChatContext.jsx: in-memory only, no persistence — resets on
// app restart. Keyed by philosopher id so switching your guide (via the You
// tab) keeps each philosopher's history separate rather than overwriting it.
interface GuideChatStore {
  conversations: Record<string, ChatCompletionMessage[]>;
  isLoading: boolean;
  send: (philosopher: Philosopher, text: string) => Promise<void>;
  clearConversation: (philosopherId: string) => void;
  resetAll: () => void;
}

export const useGuideChatStore = create<GuideChatStore>((set, get) => ({
  conversations: {},
  isLoading: false,

  send: async (philosopher, text) => {
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
      const reply = await sendMessage(withUserMessage, philosopher);
      set((state) => ({
        conversations: {
          ...state.conversations,
          [philosopher.id]: [...withUserMessage, { role: 'assistant', content: reply }],
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
    }));
  },

  // Dev/testing only — see the "Reset onboarding state" button in the You tab.
  resetAll: () => set({ conversations: {} }),
}));
