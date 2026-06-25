import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { apiUrl } from "../api/baseUrl";
import { useChat } from "../guide/ChatContext";
import { HOUSE_ROOMS } from "../content/narrativeFlow";
import { clearAllLocalData, LOCAL_CONSENT_KEY, ROOM_KEYS, readMeasureResult, readAllRooms } from "../hooks/useRoomProgress";
import LocalDataRecord from "./LocalDataRecord";
import "./PersonalSpace.css";

const API = apiUrl("/user");

function useUserProfile(token) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setProfile(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  return { profile, loading, refresh };
}

export default function PersonalSpace() {
  const { user, token, logout } = useAuth();
  const { activePhilosopher, conversations, selectPhilosopher } = useChat();
  const navigate = useNavigate();

  const { profile, loading: profileLoading, refresh: refreshProfile } = useUserProfile(token);

  const [consentLoading, setConsentLoading] = useState(false);
  const [consentMsg, setConsentMsg] = useState("");
  const [deleteStep, setDeleteStep] = useState(0); // 0=idle 1=confirm 2=typing
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  const conversationCount = Object.values(conversations ?? {}).reduce(
    (sum, msgs) => sum + (msgs?.length ?? 0),
    0
  );

  const consentGiven = profile?.consent?.psychologicalData?.given ?? false;
  const consentTimestamp = profile?.consent?.psychologicalData?.timestamp;

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function toggleConsent() {
    setConsentLoading(true);
    setConsentMsg("");
    try {
      const method = consentGiven ? "DELETE" : "POST";
      const res = await fetch(`${API}/me/consent`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await refreshProfile();
        setConsentMsg(consentGiven
          ? "Consent withdrawn. Your stored conversations have been deleted."
          : "Consent granted. Your conversations can now be saved.");
      }
    } finally {
      setConsentLoading(false);
    }
  }

  async function handleExport() {
    // Server-side data
    const res = await fetch(`${API}/me/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const serverData = res.ok ? await res.json() : null;

    // Browser-side data
    const consentRaw = localStorage.getItem(LOCAL_CONSENT_KEY);
    const fullExport = {
      exportedAt: new Date().toISOString(),
      serverData,
      browserData: {
        localDataFirstSaved: consentRaw ? JSON.parse(consentRaw).timestamp : null,
        rooms: readAllRooms(),
        summary: (() => {
          try { return JSON.parse(localStorage.getItem("sfr_summary") ?? "null"); } catch { return null; }
        })(),
        measureResult: readMeasureResult(),
      },
    };

    const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selfinder-data-${user.username}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (deleteConfirm !== user.username) {
      setDeleteError("Username does not match.");
      return;
    }
    const res = await fetch(`${API}/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      clearAllLocalData();
      logout();
      navigate("/");
    } else {
      setDeleteError("Deletion failed. Please try again.");
    }
  }

  return (
    <motion.div
      className="ps-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="ps-inner">
        <header className="ps-header">
          <p className="sf-kicker ps-kicker">Your space</p>
          <h1 className="ps-title">{user.username}</h1>
          <p className="ps-subtitle">
            Your inner work lives here — your companion, your path, your conversations.
          </p>
        </header>

        <div className="ps-grid">
          {/* Companion card */}
          <section className="ps-card ps-card--companion">
            <p className="ps-cardLabel sf-kicker">Current companion</p>
            {activePhilosopher ? (
              <div className="ps-philosopher" style={{ "--philo-color": activePhilosopher.color, "--philo-rgb": activePhilosopher.accentRgb }}>
                <span className="ps-philosopherName">{activePhilosopher.name}</span>
                <span className="ps-philosopherMode">{activePhilosopher.mode}</span>
                <button
                  type="button"
                  className="ps-changeBtn"
                  onClick={() => selectPhilosopher(null)}
                >
                  Change companion
                </button>
              </div>
            ) : (
              <div className="ps-noPhilosopher">
                <p className="ps-noPhilosopherText">No companion chosen yet.</p>
                <Link to="/" className="sf-btn">Choose at the Threshold</Link>
              </div>
            )}
          </section>

          {/* Journey card */}
          <section className="ps-card ps-card--journey">
            <p className="ps-cardLabel sf-kicker">The house</p>
            <div className="ps-roomList">
              {HOUSE_ROOMS.filter((r) => r.key !== "threshold").map((room) => (
                <Link key={room.key} to={room.route} className="ps-roomRow">
                  <span className="ps-roomStage">{room.stage}</span>
                  <span className="ps-roomLabel">{room.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Stats card */}
          <section className="ps-card ps-card--stats">
            <p className="ps-cardLabel sf-kicker">This session</p>
            <div className="ps-statList">
              <div className="ps-stat">
                <span className="ps-statValue">{conversationCount}</span>
                <span className="ps-statName">exchanges</span>
              </div>
              <div className="ps-stat">
                <span className="ps-statValue">
                  {Object.keys(conversations ?? {}).filter((k) => (conversations[k]?.length ?? 0) > 0).length}
                </span>
                <span className="ps-statName">companions spoken to</span>
              </div>
            </div>
            <p className="ps-statsNote">
              Persistent history arrives with the next update.
            </p>
          </section>
        </div>

        {/* GDPR section */}
        <section className="ps-gdpr">
          <p className="sf-kicker ps-gdprKicker">Your data & privacy</p>

          {/* Special category consent */}
          <div className="ps-gdprCard">
            <div className="ps-gdprCardHead">
              <div>
                <p className="ps-gdprCardTitle">Conversation storage</p>
                <p className="ps-gdprCardDesc">
                  Storing your conversations requires explicit consent under GDPR Article 9 —
                  this data is considered psychological health information (special category).
                  You can withdraw at any time; doing so will delete all stored conversations.
                </p>
                {consentTimestamp && (
                  <p className="ps-gdprTimestamp">
                    {consentGiven ? "Granted" : "Withdrawn"}{" "}
                    {new Date(consentTimestamp).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
              <button
                type="button"
                className={`ps-consentToggle ${consentGiven ? "is-on" : "is-off"}`}
                onClick={toggleConsent}
                disabled={consentLoading || profileLoading}
              >
                {consentLoading ? "…" : consentGiven ? "Withdraw" : "Grant consent"}
              </button>
            </div>
            {consentMsg && <p className="ps-gdprMsg">{consentMsg}</p>}
          </div>

          {/* Local browser data */}
          <div className="ps-gdprCard">
            <LocalDataRecord />
          </div>

          {/* Export */}
          <div className="ps-gdprCard">
            <div className="ps-gdprCardHead">
              <div>
                <p className="ps-gdprCardTitle">Download your data</p>
                <p className="ps-gdprCardDesc">
                  Export everything Selfinder holds about you as a JSON file —
                  your profile, consent records, saved conversations, and measure results
                  (GDPR Art. 15 &amp; 20).
                </p>
              </div>
              <button type="button" className="ps-gdprBtn" onClick={handleExport}>
                Export
              </button>
            </div>
          </div>

          {/* Account deletion */}
          <div className="ps-gdprCard ps-gdprCard--danger">
            <div className="ps-gdprCardHead">
              <div>
                <p className="ps-gdprCardTitle">Delete account</p>
                <p className="ps-gdprCardDesc">
                  Permanently removes your account and all associated data — conversations,
                  measure results, and feedback. This cannot be undone (GDPR Art. 17).
                </p>
              </div>
              {deleteStep === 0 && (
                <button type="button" className="ps-gdprBtn ps-gdprBtn--danger" onClick={() => setDeleteStep(1)}>
                  Delete
                </button>
              )}
            </div>

            <AnimatePresence>
              {deleteStep >= 1 && (
                <motion.div
                  className="ps-deleteConfirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <p className="ps-deleteWarning">
                    Type your username <strong>{user.username}</strong> to confirm permanent deletion.
                  </p>
                  <div className="ps-deleteRow">
                    <input
                      className="ps-deleteInput"
                      type="text"
                      placeholder={user.username}
                      value={deleteConfirm}
                      onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(""); }}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      className="ps-gdprBtn ps-gdprBtn--danger"
                      onClick={handleDelete}
                      disabled={!deleteConfirm}
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      className="ps-gdprBtn"
                      onClick={() => { setDeleteStep(0); setDeleteConfirm(""); setDeleteError(""); }}
                    >
                      Cancel
                    </button>
                  </div>
                  {deleteError && <p className="ps-gdprMsg ps-gdprMsg--error">{deleteError}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <div className="ps-footer">
          <button type="button" className="sf-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    </motion.div>
  );
}
