import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Eye, EyeOff, Check, X, ChevronLeft, UserPlus } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import "./Auth.css";

// Password validation helper
function validatePassword(pwd) {
  const requirements = {
    minLength: pwd.length >= 8,
    hasUppercase: /[A-Z]/.test(pwd),
    hasLowercase: /[a-z]/.test(pwd),
    hasNumber: /\d/.test(pwd),
    hasSymbol: /[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-]/.test(pwd),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  return {
    score,
    requirements,
    isValid: pwd.length >= 8 && Object.values(requirements).filter(Boolean).length >= 3,
  };
}

function getPasswordStrength(score) {
  if (score <= 1) return { label: "Weak", color: "#ef4444" };
  if (score === 2) return { label: "Fair", color: "#f97316" };
  if (score === 3) return { label: "Good", color: "#eab308" };
  if (score === 4) return { label: "Strong", color: "#84cc16" };
  return { label: "Very Strong", color: "#22c55e" };
}

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const passwordValidation = validatePassword(password);
  const passwordStrength = getPasswordStrength(passwordValidation.score);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Google auth handler — same flow as Login
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      if (credentialResponse.credential) {
        await googleLogin(credentialResponse.credential);
        navigate("/chat", { replace: true });
      }
    } catch (err) {
      console.error("Google Signup Error:", err);
      setError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      return setError("Please enter a username.");
    }

    if (!passwordValidation.isValid) {
      return setError("Password must be at least 8 characters with uppercase, number, and symbol.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);

    try {
      await register({
        username: username.trim(),
        email,
        password,
      });
      navigate("/login", { state: { registeredEmail: email.trim().toLowerCase() } });
    } catch (err) {
      setError(err.message || "Failed to create an account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Back to login */}
      <button
        type="button"
        className="auth-page__back"
        onClick={() => navigate("/login")}
        aria-label="Back to login"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="auth-card">
        {/* Header */}
        <div className="auth-card__header">
          <div className="auth-card__icon">
            <UserPlus />
          </div>
          <h1 className="auth-card__title">Create Account</h1>
          <p className="auth-card__subtitle">Join the conversation today</p>
        </div>

        {/* Error */}
        {error && <div className="auth-error">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" id="register-form">
          {/* Username */}
          <div className="auth-input-group">
            <User className="auth-input-group__icon" size={18} />
            <input
              type="text"
              id="register-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              required
            />
          </div>

          {/* Email */}
          <div className="auth-input-group">
            <Mail className="auth-input-group__icon" size={18} />
            <input
              type="email"
              id="register-email"
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
              id="register-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              required
              minLength={8}
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

          {/* Password Strength */}
          {password && (
            <div className="auth-pwd-strength">
              <div className="auth-pwd-meter">
                <div
                  className="auth-pwd-meter__bar"
                  style={{
                    width: `${(passwordValidation.score / 5) * 100}%`,
                    backgroundColor: passwordStrength.color,
                  }}
                />
              </div>
              <div className="auth-pwd-label" style={{ color: passwordStrength.color }}>
                {passwordStrength.label}
              </div>
              <div className="auth-pwd-reqs">
                {Object.entries({
                  "8+ chars": passwordValidation.requirements.minLength,
                  Uppercase: passwordValidation.requirements.hasUppercase,
                  Lowercase: passwordValidation.requirements.hasLowercase,
                  Number: passwordValidation.requirements.hasNumber,
                  Symbol: passwordValidation.requirements.hasSymbol,
                }).map(([label, met]) => (
                  <div key={label} className={`auth-pwd-req ${met ? "is-met" : ""}`}>
                    {met ? <Check size={12} /> : <X size={12} />} {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className="auth-input-group">
            <Lock className="auth-input-group__icon" size={18} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="register-confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <button
              type="button"
              className="auth-input-group__toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password Match */}
          {confirmPassword && (
            <div className={`auth-pwd-match ${passwordsMatch ? "is-match" : "is-mismatch"}`}>
              {passwordsMatch ? <Check size={16} /> : <X size={16} />}
              <span>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading || !passwordValidation.isValid || !passwordsMatch}
            id="register-submit"
          >
            {loading ? <span className="auth-spinner" /> : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>or sign up with</span>
        </div>

        {/* Google */}
        <div className="auth-google-wrap" id="register-google">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.error("Google Signup Failed");
              setError("Sign up with Google failed. Please try again.");
            }}
            shape="pill"
            theme="filled_black"
            text="signup_with"
            size="large"
            width="100%"
          />
        </div>

        {/* Footer */}
        <div className="auth-card__footer">
          Already have an account?
          <button
            type="button"
            className="auth-card__footer-link"
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
