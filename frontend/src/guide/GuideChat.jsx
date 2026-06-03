import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from './ChatContext';
import './GuideChat.css';

function PhilosopherGrid() {
  const { philosophers, selectPhilosopher } = useChat();

  return (
    <motion.div
      className="guide-select"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="guide-select-header">
        <p className="sf-kicker">Inner Dialogue</p>
        <h1 className="guide-select-title">Choose your thinking companion</h1>
        <p className="guide-select-lead">
          Each mode opens a different kind of conversation. Choose based on where you are, not where you want to be.
        </p>
      </div>

      <div className="guide-philo-grid">
        {philosophers.map((p, i) => (
          <motion.button
            key={p.id}
            className="guide-philo-card"
            style={{ '--philo-color': p.color, '--philo-rgb': p.accentRgb }}
            onClick={() => selectPhilosopher(p.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
          >
            <div className="guide-philo-accent" aria-hidden="true" />
            <p className="guide-philo-mode">{p.mode}</p>
            <h2 className="guide-philo-name">{p.name}</h2>
            <p className="guide-philo-entry">{p.entry}</p>
            <div className="guide-philo-enter" aria-hidden="true">enter →</div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function ChatInterface() {
  const { activePhilosopher, messages, send, isLoading, clearConversation, selectPhilosopher } = useChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    send(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      className="guide-chat"
      style={{ '--philo-color': activePhilosopher.color, '--philo-rgb': activePhilosopher.accentRgb }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <header className="guide-chat-header">
        <div className="guide-chat-identity">
          <span className="guide-chat-mode">{activePhilosopher.mode}</span>
          <span className="guide-chat-name">{activePhilosopher.name}</span>
        </div>
        <div className="guide-chat-controls">
          {messages.length > 0 && (
            <button className="guide-ctrl-btn" onClick={clearConversation} type="button">
              clear
            </button>
          )}
          <button className="guide-ctrl-btn" onClick={() => selectPhilosopher(null)} type="button">
            change guide
          </button>
        </div>
      </header>

      <div className="guide-chat-messages">
        {messages.length === 0 && (
          <div className="guide-chat-empty">
            <p className="guide-empty-desc">{activePhilosopher.description}</p>
            <p className="guide-empty-prompt">Begin wherever you are.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`guide-msg guide-msg-${msg.role}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <p>{msg.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            className="guide-msg guide-msg-assistant guide-msg-thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="guide-dot" />
            <span className="guide-dot" />
            <span className="guide-dot" />
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="guide-chat-form" onSubmit={handleSubmit}>
        <textarea
          className="guide-chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Speak honestly…"
          disabled={isLoading}
          rows={1}
          autoFocus
        />
        <button
          className="guide-send-btn"
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 10L17 3L10 17L9 11L3 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </motion.div>
  );
}

export default function GuideChat() {
  const { activePhilosopher } = useChat();

  return (
    <div className="guide-root">
      <AnimatePresence mode="wait">
        {activePhilosopher ? (
          <ChatInterface key="chat" />
        ) : (
          <PhilosopherGrid key="select" />
        )}
      </AnimatePresence>
    </div>
  );
}
