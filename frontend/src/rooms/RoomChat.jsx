import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendMessage } from "../guide/chatApi";
import { buildRoomPrompt } from "../content/roomContent";

export default function RoomChat({
  roomKey,
  mechanicOutput,
  philosopher,
  messages,
  onAddMessage,
  onRequestUnlock,
  isLoading,
  setIsLoading,
}) {
  const [input, setInput] = useState("");
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const hasSeededRef = useRef(false);

  const assistantMessageCount = messages.filter((m) => m.role === "assistant").length;
  const showUnlockButton = assistantMessageCount >= 3;

  // Scroll to bottom on new messages
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, isLoading]);

  // Seed the first philosopher message when the chat is empty
  useEffect(() => {
    if (hasSeededRef.current) return;
    if (messages.length > 0) {
      hasSeededRef.current = true;
      return;
    }
    if (!philosopher || isLoading) return;

    hasSeededRef.current = true;

    const roomContext = buildRoomPrompt(roomKey, mechanicOutput);

    setIsLoading(true);
    sendMessage([], philosopher, roomContext)
      .then((reply) => {
        onAddMessage({ role: "assistant", content: reply });
      })
      .catch((err) => {
        console.error("RoomChat seed error:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [philosopher, roomKey, mechanicOutput]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e && e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { role: "user", content: text };
    onAddMessage(userMsg);
    setInput("");

    const roomContext = buildRoomPrompt(roomKey, mechanicOutput);
    const nextMessages = [...messages, userMsg];

    setIsLoading(true);
    try {
      const reply = await sendMessage(nextMessages, philosopher, roomContext);
      onAddMessage({ role: "assistant", content: reply });
    } catch (err) {
      console.error("RoomChat send error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  if (!philosopher) return null;

  const philoColor = philosopher.color;
  const philoRgb = philosopher.accentRgb;

  return (
    <div
      className="re-chat"
      style={{ "--philo-color": philoColor, "--philo-rgb": philoRgb }}
    >
      <header className="re-chat-header">
        <div className="re-chat-identity">
          <span className="re-chat-mode">{philosopher.mode}</span>
          <span className="re-chat-name">{philosopher.name}</span>
        </div>
        {showUnlockButton && (
          <motion.button
            className="re-unlock-hint-btn"
            type="button"
            onClick={onRequestUnlock}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            I'm ready to name it →
          </motion.button>
        )}
      </header>

      <div className="re-chat-messages" ref={messagesRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`re-msg re-msg-${msg.role}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <p>{msg.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            className="re-msg re-msg-assistant re-msg-thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="re-dot" />
            <span className="re-dot" />
            <span className="re-dot" />
          </motion.div>
        )}
      </div>

      <form className="re-chat-form" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="re-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Speak honestly…"
          disabled={isLoading}
          rows={1}
        />
        <button
          className="re-send-btn"
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 10L17 3L10 17L9 11L3 10Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
