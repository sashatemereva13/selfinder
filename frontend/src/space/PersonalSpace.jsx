import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { apiUrl } from "../api/baseUrl";
import { useChat } from "../guide/ChatContext";
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

function useMeasureHistory(token, enabled) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token || !enabled) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/measure/history"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setHistory(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token, enabled]);

  useEffect(() => { refresh(); }, [refresh]);

  return { history, loading, refresh };
}

function formatReadingDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function PersonalSpace() {
  const { user, token, logout, changePassword } = useAuth();
  const { activePhilosopher, conversations, selectPhilosopher } = useChat();
  const navigate = useNavigate();

  const { profile, loading: profileLoading, refresh: refreshProfile } = useUserProfile(token);

  const [consentLoading, setConsentLoading] = useState(false);
  const [consentMsg, setConsentMsg] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [deleteStep, setDeleteStep] = useState(0); // 0=idle 1=confirm 2=typing
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [emailInput, setEmailInput] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [emailError, setEmailError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

  const { history, loading: historyLoading } = useMeasureHistory(token, consentGiven);

  useEffect(() => {
    if (profile?.email) setEmailInput(profile.email);
  }, [profile?.email]);

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

  async function handleUpdateEmail(e) {
    e.preventDefault();
    setEmailBusy(true);
    setEmailMsg("");
    setEmailError("");
    try {
      const res = await fetch(`${API}/me/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update email");
      await refreshProfile();
      setEmailMsg("Email saved. Password resets can now be sent to it.");
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailBusy(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordBusy(true);
    setPasswordMsg("");
    setPasswordError("");
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMsg("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setExportError("");
    try {
      // Server-side data
      const res = await fetch(`${API}/me/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export request failed");
      const serverData = await res.json();

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
    } catch {
      setExportError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
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
        <div className="ps-headerRow">
          <header className="ps-header">
            <p className="sf-kicker ps-kicker">Your space</p>
            <h1 className="ps-title">{user.username}</h1>
            <p className="ps-subtitle">
              Your inner work lives here — your companion, your path, your conversations.
            </p>
          </header>
          <Link to="/" className="sf-btn ps-thresholdLink">
            Back to the Threshold
          </Link>
        </div>

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
              <p className="ps-noPhilosopherText">No companion chosen yet.</p>
            )}
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
          </section>
        </div>

        {/* Readings card */}
        <section className="ps-card ps-card--journey">
          <p className="ps-cardLabel sf-kicker">Your readings</p>

          {!consentGiven ? (
            <p className="ps-noPhilosopherText">
              Grant consent below to start saving your Measure readings to your account.
            </p>
          ) : historyLoading ? (
            <p className="ps-noPhilosopherText">Loading…</p>
          ) : history.length === 0 ? (
            <p className="ps-noPhilosopherText">
              No readings saved yet — take a Measure check-in to start your history.
            </p>
          ) : (
            <div className="ps-roomList">
              {history.map((reading) => (
                <Link
                  key={reading.id}
                  to={reading.vibrationLevel?.route ?? "/levels"}
                  className="ps-roomRow"
                >
                  <span className="ps-roomStage">{formatReadingDate(reading.savedAt)}</span>
                  <span className="ps-roomLabel">
                    {reading.vibrationLevel?.name} · {reading.vibrationScore}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Account security */}
        <section className="ps-gdpr">
          <p className="sf-kicker ps-gdprKicker">Account security</p>

          <div className="ps-gdprCard">
            <div className="ps-gdprCardHead">
              <div>
                <p className="ps-gdprCardTitle">Email</p>
                <p className="ps-gdprCardDesc">
                  {profile?.email
                    ? "Used for password resets."
                    : "Add an email so you can reset your password if you ever forget it. Optional, but recommended."}
                </p>
              </div>
            </div>
            <form className="ps-inlineForm" onSubmit={handleUpdateEmail}>
              <input
                className="ps-inlineInput"
                type="email"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={emailBusy}
              />
              <button type="submit" className="ps-gdprBtn" disabled={emailBusy || !emailInput.trim()}>
                {emailBusy ? "…" : profile?.email ? "Update" : "Save"}
              </button>
            </form>
            {emailMsg && <p className="ps-gdprMsg">{emailMsg}</p>}
            {emailError && <p className="ps-gdprMsg ps-gdprMsg--error">{emailError}</p>}
          </div>

          <div className="ps-gdprCard">
            <div className="ps-gdprCardHead">
              <div>
                <p className="ps-gdprCardTitle">Change password</p>
                <p className="ps-gdprCardDesc">Update your password. You'll need your current one.</p>
              </div>
            </div>
            <form className="ps-inlineForm ps-inlineForm--stacked" onSubmit={handleChangePassword}>
              <input
                className="ps-inlineInput"
                type="password"
                placeholder="Current password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={passwordBusy}
              />
              <input
                className="ps-inlineInput"
                type="password"
                placeholder="New password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={passwordBusy}
              />
              <button
                type="submit"
                className="ps-gdprBtn"
                disabled={passwordBusy || !currentPassword || !newPassword}
              >
                {passwordBusy ? "…" : "Change password"}
              </button>
            </form>
            {passwordMsg && <p className="ps-gdprMsg">{passwordMsg}</p>}
            {passwordError && <p className="ps-gdprMsg ps-gdprMsg--error">{passwordError}</p>}
          </div>
        </section>

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
              <button type="button" className="ps-gdprBtn" onClick={handleExport} disabled={exporting}>
                {exporting ? "…" : "Export"}
              </button>
            </div>
            {exportError && <p className="ps-gdprMsg ps-gdprMsg--error">{exportError}</p>}
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
