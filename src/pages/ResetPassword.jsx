import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ChevronLeft, KeyRound } from "lucide-react";
import { API_URL } from "../config/app";
import "./Auth.css";

/* Simple password-strength meter helper (0-4) */
const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 6)                    score++;
  if (pwd.length >= 10)                   score++;
  if (/[A-Z]/.test(pwd))                  score++;
  if (/\d/.test(pwd) && /[a-z]/.test(pwd)) score++;
  return score;
};

const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#34d399"];

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [showPassword, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
      const res = await fetch(`${API_URL}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password. Please try again.");
      }

      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button
        type="button"
        className="auth-page__back"
        onClick={() => navigate("/login")}
        aria-label="Back to login"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__icon">
            <KeyRound />
          </div>
          <h1 className="auth-card__title">Reset Password</h1>
          <p className="auth-card__subtitle">Create a new secure password for your account</p>
        </div>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: "rgba(52, 211, 153, 0.08)",
                border: "none",
                borderRadius: "14px",
                padding: "20px 16px",
                marginBottom: "20px",
                color: "#34d399",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🎉</div>
              <strong>Password reset successful!</strong>
              <br />
              Redirecting you to the login page in 3 seconds…
            </div>
            <button
              type="button"
              className="auth-btn-primary"
              onClick={() => navigate("/login", { replace: true })}
            >
              Go to Login now
            </button>
          </div>
        ) : (
          <>
            {error && <div className="auth-error">{error}</div>}

            {!token ? (
              <div className="auth-error">
                Invalid reset link. Please request a new one.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                {/* New Password */}
                <div className="auth-input-group">
                  <Lock className="auth-input-group__icon" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="rp-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-input-group__toggle"
                    onClick={() => setShowPwd(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Strength meter */}
                {password.length > 0 && (
                  <div className="auth-pwd-strength">
                    <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: "4px",
                            borderRadius: "2px",
                            background: i <= strength ? strengthColor[strength] : "rgba(255,255,255,0.06)",
                            transition: "background 0.3s ease",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: strengthColor[strength],
                        fontWeight: 600,
                      }}
                    >
                      {strengthLabel[strength]}
                    </span>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="auth-input-group">
                  <Lock className="auth-input-group__icon" size={18} />
                  <input
                    type={showConfirm ? "text" : "password"}
                    id="rp-confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-input-group__toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Match indicator */}
                {confirmPassword.length > 0 && (
                  <div className={`auth-pwd-match ${password === confirmPassword ? "is-match" : "is-mismatch"}`}>
                    <span>
                      {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-btn-primary"
                  disabled={loading || !password || !confirmPassword}
                >
                  {loading ? <span className="auth-spinner" /> : "Reset Password"}
                </button>

                <div className="auth-card__footer">
                  Changed your mind?
                  <button
                    type="button"
                    className="auth-card__footer-link"
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
