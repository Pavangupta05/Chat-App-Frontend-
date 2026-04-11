import { useNavigate } from "react-router-dom";
import { MessageCircle, ArrowRight } from "lucide-react";
import "./Onboarding.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="ob-page">
      {/* Ambient glow orbs */}
      <div className="ob-glow-orb ob-glow-orb--1" />
      <div className="ob-glow-orb ob-glow-orb--2" />

      {/* Top nav */}
      <nav className="ob-nav">
        <span className="ob-nav__brand">TalkNow+</span>
        <button
          className="ob-nav__skip"
          onClick={() => navigate("/login")}
          id="ob-skip-btn"
        >
          Skip
        </button>
      </nav>

      {/* Progress dots */}
      <div className="ob-progress">
        <div className="ob-progress__dot is-active" />
        <div className="ob-progress__dot" />
        <div className="ob-progress__dot" />
      </div>

      {/* Main content */}
      <div className="ob-content">
        <div className="ob-hero-icon">
          <MessageCircle />
        </div>

        <p className="ob-tagline">Welcome to the future</p>

        <h1 className="ob-title">
          Chat without <span>limits</span>
        </h1>

        <p className="ob-subtitle">
          Fast, secure, and beautifully crafted messaging — connect with anyone,
          anywhere, in real time.
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="ob-footer">
        <button
          className="ob-cta"
          onClick={() => navigate("/features")}
          id="ob-get-started-btn"
        >
          Get Started
          <ArrowRight />
        </button>
        <p className="ob-footer__hint">Swipe or tap to continue</p>
      </div>
    </div>
  );
};

export default LandingPage;
