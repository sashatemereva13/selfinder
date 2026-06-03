import { createContext, useCallback, useContext, useState } from 'react';
import { PHILOSOPHERS } from './philosophers';
import { sendMessage } from './chatApi';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [philosopherId, setPhilosopherId] = useState(null);
  const [conversations, setConversations] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
      send,
      isLoading,
      clearConversation,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
