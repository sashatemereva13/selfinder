import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import "./AuthPage.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Both fields are required.");
      return;
    }

    if (mode === "register" && !privacyAccepted) {
      setError("Please accept the privacy policy to create an account.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, privacyAccepted);
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError("");
    setPrivacyAccepted(false);
  }

  const dataNotice = mode === "login"
    ? "Your account details are stored so you can sign in. Conversation history is only saved if you later grant explicit consent in Your Space."
    : "Creating an account stores your username and password hash to provide sign-in. Conversation history is only saved if you later grant explicit consent in Your Space.";

  return (
    <div className="authPage">
      <Link to="/" className="authBackLink">
        Back to threshold
      </Link>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          className="authCard"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <p className="sf-kicker authKicker">Selfinder</p>

          <h1 className="authTitle">
            {mode === "login" ? "Welcome back" : "Begin your journey"}
          </h1>

          <p className="authSubtitle">
            {mode === "login"
              ? "Sign in to continue your exploration."
              : "Create an account to save your conversations and track your path."}
          </p>

          <p className="authDataNotice">
            {dataNotice}
          </p>

          <form className="authForm" onSubmit={handleSubmit} noValidate>
            <label className="authLabel">
              <span className="authLabelText">Username</span>
              <input
                className="authInput"
                type="text"
                autoComplete={mode === "register" ? "username" : "username"}
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </label>

            <label className="authLabel">
              <span className="authLabelText">Password</span>
              <input
                className="authInput"
                type="password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </label>

            {mode === "register" && (
              <label className="authCheckboxLabel">
                <input
                  type="checkbox"
                  className="authCheckbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  disabled={loading}
                />
                <span className="authCheckboxText">
                  I have read and accept the{" "}
                  <button
                    type="button"
                    className="authPrivacyLink"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPrivacyModal(true);
                    }}
                  >
                    privacy policy
                  </button>
                  . Selfinder may store my account data (username and password
                  hash) to provide sign-in. Saving conversation history
                  requires separate consent after registration.
                </span>
              </label>
            )}

            {error && (
              <motion.p
                className="authError"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              className="authSubmit"
              disabled={loading}
            >
              {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="authFooter">
            <button className="authSwitch" type="button" onClick={switchMode}>
              {mode === "login"
                ? "No account? Create one"
                : "Already have an account? Sign in"}
            </button>

            <button
              className="authSkip"
              type="button"
              onClick={() => navigate("/")}
            >
              Continue without account
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {showPrivacyModal && (
        <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />
      )}
    </div>
  );
}
