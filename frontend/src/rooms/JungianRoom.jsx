import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HOUSE_ROOMS, getNextHouseRoom } from "../content/narrativeFlow";
import { useChat } from "../guide/ChatContext";
import "./JungianRoom.css";

const ROOM_VISUALS = {
  shadow: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="jr-visual" aria-hidden="true">
      <circle cx="60" cy="60" r="50" stroke="rgba(168,122,201,0.2)" strokeWidth="1" />
      <circle cx="60" cy="60" r="35" stroke="rgba(168,122,201,0.15)" strokeWidth="1" />
      <path d="M60 10 a50 50 0 0 1 0 100" fill="rgba(80,40,120,0.18)" />
      <path d="M60 25 a35 35 0 0 1 0 70" fill="rgba(80,40,120,0.12)" />
    </svg>
  ),
  anima: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="jr-visual" aria-hidden="true">
      <circle cx="42" cy="60" r="32" stroke="rgba(195,153,255,0.22)" strokeWidth="1" />
      <circle cx="78" cy="60" r="32" stroke="rgba(116,221,214,0.22)" strokeWidth="1" />
      <ellipse cx="60" cy="60" rx="14" ry="32" fill="rgba(195,153,255,0.07)" stroke="rgba(195,153,255,0.12)" strokeWidth="0.5" />
    </svg>
  ),
  innerchild: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="jr-visual" aria-hidden="true">
      <polygon points="60,8 67,38 98,38 74,56 82,86 60,68 38,86 46,56 22,38 53,38" stroke="rgba(195,153,255,0.3)" strokeWidth="1" fill="rgba(195,153,255,0.05)" />
      <polygon points="60,28 64,44 80,44 67,53 72,69 60,61 48,69 53,53 40,44 56,44" stroke="rgba(116,221,214,0.2)" strokeWidth="0.8" fill="rgba(116,221,214,0.04)" />
    </svg>
  ),
  self: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="jr-visual" aria-hidden="true">
      <circle cx="60" cy="60" r="52" stroke="rgba(195,153,255,0.18)" strokeWidth="1" />
      <circle cx="60" cy="60" r="36" stroke="rgba(195,153,255,0.14)" strokeWidth="1" />
      <circle cx="60" cy="60" r="20" stroke="rgba(116,221,214,0.18)" strokeWidth="1" />
      <circle cx="60" cy="60" r="5" fill="rgba(195,153,255,0.5)" />
      <line x1="60" y1="6" x2="60" y2="22" stroke="rgba(195,153,255,0.2)" strokeWidth="1" />
      <line x1="60" y1="98" x2="60" y2="114" stroke="rgba(195,153,255,0.2)" strokeWidth="1" />
      <line x1="6" y1="60" x2="22" y2="60" stroke="rgba(195,153,255,0.2)" strokeWidth="1" />
      <line x1="98" y1="60" x2="114" y2="60" stroke="rgba(195,153,255,0.2)" strokeWidth="1" />
    </svg>
  ),
};

const ROOM_INVITATIONS = {
  shadow: "The shadow doesn't disappear when you ignore it. Your companion walks beside you here.",
  anima: "What we see in others is often ourselves, looking back. Your companion can help you look.",
  innerchild: "What did you leave behind? Your companion walks back with you.",
  self: "You arrive here having passed through everything else.",
};

export default function JungianRoom({ roomKey }) {
  const room = HOUSE_ROOMS.find((r) => r.key === roomKey);
  const nextRoom = room ? getNextHouseRoom(roomKey) : null;
  const { activePhilosopher } = useChat();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [roomKey]);

  if (!room) return null;

  const visual = ROOM_VISUALS[roomKey] ?? null;
  const invitation = ROOM_INVITATIONS[roomKey] ?? null;

  return (
    <motion.div
      className="jr-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="jr-inner">
        <header className="jr-header">
          <p className="jr-stage sf-kicker">{room.stage}</p>
          <h1 className="jr-title">{room.label}</h1>
          <p className="jr-description">{room.description}</p>
        </header>

        {visual && (
          <motion.div
            className="jr-visualWrap"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          >
            {visual}
          </motion.div>
        )}

        {room.themes && (
          <div className="jr-themes" aria-label="Themes">
            {room.themes.map((t) => (
              <span key={t} className="jr-theme">{t}</span>
            ))}
          </div>
        )}

        {invitation && (
          <motion.div
            className="jr-invitation"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          >
            {activePhilosopher ? (
              <p className="jr-invitationText">
                <span className="jr-invitationPhilo" style={{ color: activePhilosopher.color }}>
                  {activePhilosopher.name}
                </span>{" "}
                is with you here. {invitation}
              </p>
            ) : (
              <p className="jr-invitationText">{invitation}</p>
            )}
          </motion.div>
        )}

        {nextRoom && (
          <div className="jr-next">
            <Link to={nextRoom.route} className="sf-btn">
              {nextRoom.label} →
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
