import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ChevronLeft, Shield } from "lucide-react";
import { API_URL } from "../config/app";
import "./Auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
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
            <Shield />
          </div>
          <h1 className="auth-card__title">Forgot Password</h1>
          <p className="auth-card__subtitle">Enter your email and we'll send a reset link</p>
        </div>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: "rgba(52, 211, 153, 0.08)",
                border: "1px solid rgba(52, 211, 153, 0.2)",
                borderRadius: "14px",
                padding: "20px 16px",
                marginBottom: "20px",
                color: "#34d399",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✅</div>
              <strong>Check your server console!</strong>
              <br />
              A password reset link has been logged. Open your terminal and copy
              it into your browser. The link expires in <strong>15 minutes</strong>.
            </div>

            <button
              type="button"
              className="auth-btn-primary"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <Mail className="auth-input-group__icon" size={18} />
                <input
                  type="email"
                  id="fp-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="auth-btn-primary"
                disabled={loading || !email.trim()}
              >
                {loading ? <span className="auth-spinner" /> : "Send Reset Link"}
              </button>
            </form>

            <div className="auth-card__footer">
              Remember your password?
              <button
                type="button"
                className="auth-card__footer-link"
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
