import { createContext, useCallback, useContext, useState } from 'react';
import { PHILOSOPHERS } from '../content/philosophers';
import { sendMessage } from './chatApi';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [philosopherId, setPhilosopherId] = useState(null);
  const [conversations, setConversations] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // Set once the player touches the magic ball — lets GuideAnchor (mounted
  // outside the Canvas, with no view into the threshold's own phase state)
  // know to stop showing the "touch the sphere" line once they've done so.
  const [thresholdEngaged, setThresholdEngaged] = useState(false);
  // Set once the threshold's journey stage unlocks — same cross-Canvas
  // signal as thresholdEngaged, above, but for the "you're ready to enter
  // the house" milestone. GuideAnchor renders that line itself (one speech
  // channel instead of FrontPage's own separate overlay) once this flips.
  const [journeyUnlocked, setJourneyUnlocked] = useState(false);

  const activePhilosopher = PHILOSOPHERS.find(p => p.id === philosopherId) ?? null;
  const messages = philosopherId ? (conversations[philosopherId] ?? []) : [];

  const selectPhilosopher = useCallback((id) => {
    setPhilosopherId(id);
  }, []);

  const send = useCallback(async (text) => {
    if (!activePhilosopher || isLoading || !text.trim()) return;

    const userMsg = { role: 'user', content: text.trim() };
    const nextMessages = [...messages, userMsg];

    setConversations(prev => ({ ...prev, [philosopherId]: nextMessages }));
    setIsLoading(true);

    try {
      const reply = await sendMessage(nextMessages, activePhilosopher);
      setConversations(prev => ({
        ...prev,
        [philosopherId]: [
          ...(prev[philosopherId] ?? []),
          { role: 'assistant', content: reply },
        ],
      }));
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activePhilosopher, philosopherId, messages, isLoading]);

  const clearConversation = useCallback(() => {
    if (philosopherId) {
      setConversations(prev => ({ ...prev, [philosopherId]: [] }));
    }
  }, [philosopherId]);

  return (
    <ChatContext.Provider value={{
      philosophers: PHILOSOPHERS,
      activePhilosopher,
      selectPhilosopher,
      messages,
      conversations,
      send,
      isLoading,
      clearConversation,
      thresholdEngaged,
      setThresholdEngaged,
      journeyUnlocked,
      setJourneyUnlocked,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
