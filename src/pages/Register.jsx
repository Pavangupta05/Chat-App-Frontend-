import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../App.css";

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
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordValidation = validatePassword(password);
  const passwordStrength = getPasswordStrength(passwordValidation.score);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="var(--accent-strong)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1>Create Account</h1>
          <p>Join Neon Relay Chat today</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="superchatuser"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          {password && (
            <div className="password-strength-container">
              <div className="password-strength-meter">
                <div 
                  className="password-strength-bar" 
                  style={{
                    width: `${(passwordValidation.score / 5) * 100}%`,
                    backgroundColor: passwordStrength.color,
                  }}
                />
              </div>
              <span 
                className="password-strength-label"
                style={{ color: passwordStrength.color }}
              >
                Strength: {passwordStrength.label}
              </span>
              
              <div className="password-requirements">
                <div className={`requirement ${passwordValidation.requirements.minLength ? 'met' : ''}`}>
                  {passwordValidation.requirements.minLength ? '✓' : '○'} At least 8 characters
                </div>
                <div className={`requirement ${passwordValidation.requirements.hasUppercase ? 'met' : ''}`}>
                  {passwordValidation.requirements.hasUppercase ? '✓' : '○'} Uppercase letter (A-Z)
                </div>
                <div className={`requirement ${passwordValidation.requirements.hasLowercase ? 'met' : ''}`}>
                  {passwordValidation.requirements.hasLowercase ? '✓' : '○'} Lowercase letter (a-z)
                </div>
                <div className={`requirement ${passwordValidation.requirements.hasNumber ? 'met' : ''}`}>
                  {passwordValidation.requirements.hasNumber ? '✓' : '○'} Number (0-9)
                </div>
                <div className={`requirement ${passwordValidation.requirements.hasSymbol ? 'met' : ''}`}>
                  {passwordValidation.requirements.hasSymbol ? '✓' : '○'} Symbol (!@#$%^&*)
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          {confirmPassword && (
            <div 
              className="password-match-status"
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: passwordsMatch ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                color: passwordsMatch ? "#22c55e" : "#ef4444",
              }}
            >
              <span>{passwordsMatch ? '✓' : '✕'}</span>
              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading || !passwordValidation.isValid || !passwordsMatch}
          >
            {loading ? <span className="auth-spinner"></span> : "Create account"}
          </button>
        </form>

        <div
          className="auth-footer"
          style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}
        >
          <span className="auth-footer-hint">Already have an account?</span>
          <button
            type="button"
            className="auth-button auth-button--secondary"
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
