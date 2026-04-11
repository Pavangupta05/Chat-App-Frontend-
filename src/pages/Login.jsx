import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, MessageCircle, ChevronLeft } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import "./Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Google auth handler (shared logic)
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      if (credentialResponse.credential) {
        await googleLogin(credentialResponse.credential);
        navigate("/chat", { replace: true });
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      setError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill email from registration redirect
  useEffect(() => {
    const prefill = location.state?.registeredEmail;
    if (typeof prefill === "string" && prefill) {
      setEmail(prefill);
      navigate("/login", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/chat", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const isSendable = Boolean(email?.trim());

  return (
    <div className="auth-page">
      {/* Back to onboarding */}
      <button
        type="button"
        className="auth-page__back"
        onClick={() => navigate("/welcome")}
        aria-label="Back"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="auth-card">
        {/* Header */}
        <div className="auth-card__header">
          <div className="auth-card__icon">
            <MessageCircle />
          </div>
          <h1 className="auth-card__title">Welcome Back</h1>
          <p className="auth-card__subtitle">Sign in to continue chatting</p>
        </div>

        {/* Error */}
        {error && <div className="auth-error">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" id="login-form">
          {/* Email */}
          <div className="auth-input-group">
            <Mail className="auth-input-group__icon" size={18} />
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div className="auth-input-group">
            <Lock className="auth-input-group__icon" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="auth-input-group__toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Forgot password */}
          <button
            type="button"
            className="auth-forgot"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </button>

          {/* Submit */}
          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading || !isSendable}
            id="login-submit"
          >
            {loading ? <span className="auth-spinner" /> : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        {/* Google */}
        <div className="auth-google-wrap" id="login-google">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.error("Google Login Failed");
              setError("Login with Google failed. Please try again.");
            }}
            useOneTap
            shape="pill"
            theme="filled_black"
            text="continue_with"
            size="large"
            width="100%"
          />
        </div>

        {/* Footer */}
        <div className="auth-card__footer">
          Don't have an account?
          <button
            type="button"
            className="auth-card__footer-link"
            onClick={() => navigate("/register")}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
