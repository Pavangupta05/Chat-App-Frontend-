import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Eye, EyeOff, Check, X, ChevronLeft } from "lucide-react";
import "../App.css";

// Custom Social Icons
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.23.81-.61z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.82-.779.883-1.468 2.337-1.287 3.713 1.351.104 2.73-.69 3.574-1.703z"/>
  </svg>
);


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
      <button 
        type="button"
        className="auth-back-btn" 
        onClick={() => navigate("/login")}
        aria-label="Back to login"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join the conversation today</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <div className="password-input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                    backgroundColor: passwordStrength.color
                  }}
                />
              </div>
              <div className="password-strength-footer">
                <span className="password-strength-label" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
              
              <div className="password-requirements">
                {Object.entries({
                  "Length": passwordValidation.requirements.minLength,
                  "Uppercase": passwordValidation.requirements.hasUppercase,
                  "Lowercase": passwordValidation.requirements.hasLowercase,
                  "Number": passwordValidation.requirements.hasNumber,
                  "Symbol": passwordValidation.requirements.hasSymbol
                }).map(([label, met]) => (
                  <div key={label} className={`requirement ${met ? 'met' : ''}`}>
                    {met ? <Check size={12} /> : <X size={12} />} {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginTop: password ? "4px" : "0" }}>
            <div className="password-input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
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
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {confirmPassword && (
            <div className={`password-match-status ${passwordsMatch ? 'match' : 'mismatch'}`}>
              {passwordsMatch ? <Check size={16} /> : <X size={16} />}
              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading || !passwordValidation.isValid || !passwordsMatch}
            style={{ marginTop: "12px" }}
          >
            {loading ? <span className="auth-spinner"></span> : "Create Account"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or sign up with</span>
        </div>

        <div className="social-buttons">
          <button type="button" className="social-button" aria-label="Sign up with Google">
            <GoogleIcon />
            <span>Google</span>
          </button>
          <button type="button" className="social-button" aria-label="Sign up with Apple">
            <AppleIcon />
            <span>Apple</span>
          </button>
          <button type="button" className="social-button social-button--icon" aria-label="Sign up with Facebook">
            <FacebookIcon />
          </button>
        </div>

        <div className="auth-footer">
          Already have an account? 
          <span className="auth-link" onClick={() => navigate("/login")} style={{ color: "#3390EC" }}>
            Log In
          </span>
        </div>
      </div>
    </div>
  );
}

export default Register;
