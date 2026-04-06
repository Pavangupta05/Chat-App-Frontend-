import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* Simple password-strength meter helper (0-4) */
const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 6)                    score++;
  if (pwd.length >= 10)                   score++;
  if (/[A-Z]/.test(pwd))                  score++;
  if (/\d/.test(pwd) && /[a-z]/.test(pwd)) score++;
  return score; // 0 = empty, 1 = weak, 2 = fair, 3 = good, 4 = strong
};

const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#34d399"];

function ResetPassword() {
  const { token }                         = useParams();
  const navigate                          = useNavigate();

  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirm]     = useState("");
  const [showPassword, setShowPwd]        = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState(false);

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return setError("Password must contain at least one letter and one number.");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password/${token}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password. Please try again.");
      }

      setSuccess(true);

      // Auto-redirect to login after 3 seconds
      setTimeout(() => navigate("/login", { replace: true }), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* Eye icon helper */
  const EyeIcon = ({ visible }) =>
    visible ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    );

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="var(--accent-strong)" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="var(--accent-strong)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>Reset Password</h1>
          <p>Create a new secure password for your account</p>
        </div>

        {/* Success State */}
        {success ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: "rgba(52, 211, 153, 0.12)",
                border: "1px solid rgba(52, 211, 153, 0.35)",
                borderRadius: "12px",
                padding: "1.25rem 1rem",
                marginBottom: "1.5rem",
                color: "#34d399",
                fontSize: "0.9rem",
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</div>
              <strong>Password reset successful!</strong>
              <br />
              Redirecting you to the login page in 3 seconds…
            </div>
            <button
              type="button"
              className="auth-button"
              onClick={() => navigate("/login", { replace: true })}
            >
              Go to Login now
            </button>
          </div>
        ) : (
          <>
            {/* Error Alert */}
            {error && <div className="auth-error">{error}</div>}

            {/* Token missing guard */}
            {!token ? (
              <div className="auth-error">
                Invalid reset link. Please request a new one.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">

                {/* New Password */}
                <div className="form-group">
                  <label htmlFor="rp-password">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="rp-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 chars, incl. a number"
                      autoComplete="new-password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPwd(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div style={{ marginTop: "8px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          marginBottom: "4px",
                        }}
                      >
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: "4px",
                              borderRadius: "2px",
                              background: i <= strength ? strengthColor[strength] : "var(--border-color, #333)",
                              transition: "background 0.3s ease",
                            }}
                          />
                        ))}
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: strengthColor[strength],
                          fontWeight: 500,
                        }}
                      >
                        {strengthLabel[strength]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label htmlFor="rp-confirm">Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirm ? "text" : "password"}
                      id="rp-confirm"
                      value={confirmPassword}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your new password"
                      autoComplete="new-password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      <EyeIcon visible={showConfirm} />
                    </button>
                  </div>
                  {/* Match indicator */}
                  {confirmPassword.length > 0 && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        marginTop: "4px",
                        display: "block",
                        color: password === confirmPassword ? "#34d399" : "#ef4444",
                      }}
                    >
                      {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading || !password || !confirmPassword}
                >
                  {loading ? <span className="auth-spinner" /> : "Reset Password"}
                </button>

                <div
                  className="auth-footer"
                  style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}
                >
                  <span className="auth-footer-hint">Changed your mind?</span>
                  <button
                    type="button"
                    className="auth-button auth-button--secondary"
                    onClick={() => navigate("/login")}
                    disabled={loading}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
