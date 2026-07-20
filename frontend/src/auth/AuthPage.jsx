import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import "./AuthPage.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot-request" | "forgot-reset"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const { login, register, requestPasswordReset, resetPassword } = useAuth();
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
        await register(username.trim(), password, privacyAccepted, email.trim());
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotRequest(e) {
    e.preventDefault();
    if (!username.trim()) {
      setError("Enter your username.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(username.trim());
      setNotice("If that account has an email on file, a reset code was sent to it.");
      setMode("forgot-reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotReset(e) {
    e.preventDefault();
    if (!code.trim() || !newPassword) {
      setError("Enter the code and a new password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(username.trim(), code.trim(), newPassword);
      setNotice("Password reset. Sign in with your new password.");
      setMode("login");
      setPassword("");
      setCode("");
      setNewPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError("");
    setNotice("");
    setPrivacyAccepted(false);
  }

  function goToForgot() {
    setMode("forgot-request");
    setError("");
    setNotice("");
  }

  function backToLogin() {
    setMode("login");
    setError("");
    setNotice("");
    setCode("");
    setNewPassword("");
  }

  const dataNotice = mode === "login"
    ? "Your account details are stored so you can sign in. Conversation history is only saved if you later grant explicit consent in Your Space."
    : mode === "register"
    ? "Creating an account stores your username and password hash to provide sign-in. Email is optional and used only so you can reset your password if you forget it — add it later in Your Space if you'd rather skip it now."
    : "Password resets are sent to the email on file for your account, if you've added one in Your Space.";

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
            {mode === "login" && "Welcome back"}
            {mode === "register" && "Begin your journey"}
            {mode === "forgot-request" && "Reset your password"}
            {mode === "forgot-reset" && "Enter your code"}
          </h1>

          <p className="authSubtitle">
            {mode === "login" && "Sign in to continue your exploration."}
            {mode === "register" && "Create an account to save your conversations and track your path."}
            {mode === "forgot-request" && "We'll email a code to the address on file, if you've added one."}
            {mode === "forgot-reset" && "Check your inbox for the 6-digit code."}
          </p>

          <p className="authDataNotice">
            {dataNotice}
          </p>

          {notice && (
            <motion.p
              className="authDataNotice"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="status"
            >
              {notice}
            </motion.p>
          )}

          {(mode === "login" || mode === "register") && (
            <form className="authForm" onSubmit={handleSubmit} noValidate>
              <label className="authLabel">
                <span className="authLabelText">Username</span>
                <input
                  className="authInput"
                  type="text"
                  autoComplete="username"
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
                <label className="authLabel">
                  <span className="authLabelText">Email (optional)</span>
                  <input
                    className="authInput"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </label>
              )}

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

              <button type="submit" className="authSubmit" disabled={loading}>
                {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
          )}

          {mode === "forgot-request" && (
            <form className="authForm" onSubmit={handleForgotRequest} noValidate>
              <label className="authLabel">
                <span className="authLabelText">Username</span>
                <input
                  className="authInput"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </label>

              {error && (
                <motion.p className="authError" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert">
                  {error}
                </motion.p>
              )}

              <button type="submit" className="authSubmit" disabled={loading}>
                {loading ? "…" : "Send code"}
              </button>
            </form>
          )}

          {mode === "forgot-reset" && (
            <form className="authForm" onSubmit={handleForgotReset} noValidate>
              <label className="authLabel">
                <span className="authLabelText">Reset code</span>
                <input
                  className="authInput"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                />
              </label>

              <label className="authLabel">
                <span className="authLabelText">New password</span>
                <input
                  className="authInput"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </label>

              {error && (
                <motion.p className="authError" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert">
                  {error}
                </motion.p>
              )}

              <button type="submit" className="authSubmit" disabled={loading}>
                {loading ? "…" : "Reset password"}
              </button>
            </form>
          )}

          <div className="authFooter">
            {mode === "login" && (
              <button className="authSwitch" type="button" onClick={goToForgot}>
                Forgot password?
              </button>
            )}

            {(mode === "login" || mode === "register") && (
              <button className="authSwitch" type="button" onClick={switchMode}>
                {mode === "login" ? "No account? Create one" : "Already have an account? Sign in"}
              </button>
            )}

            {(mode === "forgot-request" || mode === "forgot-reset") && (
              <button className="authSwitch" type="button" onClick={backToLogin}>
                Back to sign in
              </button>
            )}

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
