import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ForgotPassword() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="var(--accent-strong)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1>Forgot Password</h1>
          <p>Enter your email and we'll send a reset link</p>
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
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
              <strong>Check your server console!</strong>
              <br />
              A password reset link has been logged. Open your terminal and copy
              it into your browser. The link expires in <strong>15 minutes</strong>.
            </div>

            <button
              type="button"
              className="auth-button auth-button--secondary"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            {/* Error Alert */}
            {error && <div className="auth-error">{error}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="fp-email">Email Address</label>
                <input
                  type="email"
                  id="fp-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={loading || !email.trim()}
              >
                {loading ? <span className="auth-spinner" /> : "Send Reset Link"}
              </button>
            </form>

            {/* Footer */}
            <div
              className="auth-footer"
              style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}
            >
              <span className="auth-footer-hint">Remember your password?</span>
              <button
                type="button"
                className="auth-button auth-button--secondary"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
