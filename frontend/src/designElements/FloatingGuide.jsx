import { useState, useId, useRef, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useInRouterContext, useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '../guide/ChatContext';
import './FloatingGuide.css';

function OracleIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sfOracleGlow" x1="12" y1="10" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c3a0ff" />
          <stop offset="100%" stopColor="#74ddd6" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="32" rx="20" ry="20" fill="url(#sfOracleGlow)" fillOpacity="0.12" />
      <ellipse cx="32" cy="32" rx="20" ry="20" stroke="url(#sfOracleGlow)" strokeWidth="1.4" fill="none" />
      <ellipse cx="32" cy="32" rx="7" ry="7" fill="url(#sfOracleGlow)" fillOpacity="0.8" />
      <ellipse cx="32" cy="32" rx="2.8" ry="2.8" fill="rgba(8,8,12,0.85)" />
      <line x1="32" y1="8" x2="32" y2="15" stroke="url(#sfOracleGlow)" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <line x1="32" y1="49" x2="32" y2="56" stroke="url(#sfOracleGlow)" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <line x1="8" y1="32" x2="15" y2="32" stroke="url(#sfOracleGlow)" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <line x1="49" y1="32" x2="56" y2="32" stroke="url(#sfOracleGlow)" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function MiniPhilosopherSelect({ onExpand }) {
  const { philosophers, selectPhilosopher } = useChat();

  return (
    <div className="sfg-mini-select">
      <p className="sfg-mini-label">Choose a guide to begin</p>
      <div className="sfg-mini-philosophers">
        {philosophers.map(p => (
          <button
            key={p.id}
            className="sfg-mini-philo"
            style={{ '--philo-color': p.color }}
            onClick={() => selectPhilosopher(p.id)}
            type="button"
          >
            <span className="sfg-mini-dot" aria-hidden="true" />
            <span className="sfg-mini-philo-name">{p.name}</span>
            <span className="sfg-mini-philo-mode">{p.mode}</span>
          </button>
        ))}
      </div>
      <button className="sfg-open-btn" onClick={onExpand} type="button">
        Open full room →
      </button>
    </div>
  );
}

function MiniChatInterface({ onExpand }) {
  const { activePhilosopher, messages, send, isLoading, selectPhilosopher } = useChat();
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

  return (
    <div
      className="sfg-mini-chat"
      style={{ '--philo-color': activePhilosopher.color, '--philo-rgb': activePhilosopher.accentRgb }}
    >
      <div className="sfg-mini-header">
        <span className="sfg-mini-who" style={{ color: activePhilosopher.color }}>
          {activePhilosopher.name}
        </span>
        <div className="sfg-mini-actions">
          <button className="sfg-mini-action" onClick={() => selectPhilosopher(null)} type="button">
            change
          </button>
          <button className="sfg-mini-action" onClick={onExpand} type="button">
            expand
          </button>
        </div>
      </div>

      <div className="sfg-mini-messages">
        {messages.length === 0 ? (
          <p className="sfg-mini-empty">{activePhilosopher.description}</p>
        ) : (
          messages.slice(-6).map((msg, i) => (
            <div key={i} className={`sfg-mini-msg sfg-mini-msg-${msg.role}`}>
              <p>{msg.content}</p>
            </div>
          ))
        )}
        {isLoading && (
          <div className="sfg-mini-msg sfg-mini-msg-assistant sfg-mini-thinking">
            <span className="guide-dot" />
            <span className="guide-dot" />
            <span className="guide-dot" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="sfg-mini-form" onSubmit={handleSubmit}>
        <input
          className="sfg-mini-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Speak…"
          disabled={isLoading}
        />
        <button
          className="sfg-mini-send"
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send"
        >
          →
        </button>
      </form>
    </div>
  );
}

function FloatingGuideBase({ routeKey = '', onExpand }) {
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { activePhilosopher } = useChat();

  useEffect(() => {
    setIsOpen(false);
  }, [routeKey]);

  const handleExpand = () => {
    setIsOpen(false);
    onExpand?.();
  };

  return (
    <aside className={`sfg-floater ${isOpen ? 'is-open' : ''}`} aria-label="Selfinder Guide">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            id={panelId}
            className="sfg-panel"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: prefersReducedMotion ? 0.16 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="sfg-panel-header">
              <p className="sfg-panel-eyebrow">Selfinder Guide</p>
              <p className="sfg-panel-subtitle">A structured inner conversation</p>
            </div>

            {activePhilosopher ? (
              <MiniChatInterface onExpand={handleExpand} />
            ) : (
              <MiniPhilosopherSelect onExpand={handleExpand} />
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className="sfg-toggle"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? 'Close guide panel' : 'Open guide panel'}
        animate={prefersReducedMotion ? undefined : { y: [0, -4, 0] }}
        transition={prefersReducedMotion ? undefined : {
          duration: 5.2,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <span className="sfg-toggle-glow" aria-hidden="true" />
        <span className="sfg-toggle-icon" aria-hidden="true">
          <OracleIcon />
        </span>
        <span className="sfg-toggle-label">{isOpen ? 'close' : 'guide'}</span>
      </motion.button>
    </aside>
  );
}

function FloatingGuideWithRouter() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/guide') return null;

  return (
    <FloatingGuideBase
      routeKey={location.pathname}
      onExpand={() => navigate('/guide')}
    />
  );
}

export default function FloatingGuide() {
  if (!useInRouterContext()) return null;
  return <FloatingGuideWithRouter />;
}
