import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Phone,
  Shield,
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";
import "./Onboarding.css";

const features = [
  {
    icon: <MessageCircle />,
    title: "Real-time Messaging",
    desc: "Instant delivery with typing indicators, read receipts, and rich media support.",
    color: "blue",
  },
  {
    icon: <Phone />,
    title: "Voice Calling",
    desc: "Crystal-clear audio calls with one tap — connect face to face, effortlessly.",
    color: "purple",
  },
  {
    icon: <Shield />,
    title: "Secure Authentication",
    desc: "End-to-end security with Google OAuth and encrypted sessions you can trust.",
    color: "green",
  },
  {
    icon: <ImageIcon />,
    title: "Media Sharing",
    desc: "Share photos, videos, and files instantly with beautiful inline previews.",
    color: "amber",
  },
];

const FeaturesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="ob-page">
      <div className="ob-glow-orb ob-glow-orb--1" />
      <div className="ob-glow-orb ob-glow-orb--2" />

      <nav className="ob-nav">
        <span className="ob-nav__brand">TalkNow+</span>
        <button
          className="ob-nav__skip"
          onClick={() => navigate("/login")}
          id="ob-features-skip"
        >
          Skip
        </button>
      </nav>

      {/* Progress dots */}
      <div className="ob-progress">
        <div className="ob-progress__dot is-done" />
        <div className="ob-progress__dot is-active" />
        <div className="ob-progress__dot" />
      </div>

      <div className="ob-content ob-page-enter" style={{ gap: "20px" }}>
        <p className="ob-tagline">Why TalkNow+</p>

        <h1 className="ob-title">
          Everything you <span>need</span>
        </h1>

        <p className="ob-subtitle" style={{ marginBottom: "8px" }}>
          Built for modern communication
        </p>

        <div className="ob-features">
          {features.map((f, i) => (
            <div className="ob-feature-card" key={i} id={`feature-card-${i}`}>
              <div className={`ob-feature-card__icon ob-feature-card__icon--${f.color}`}>
                {f.icon}
              </div>
              <div className="ob-feature-card__text">
                <h3 className="ob-feature-card__title">{f.title}</h3>
                <p className="ob-feature-card__desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ob-footer">
        <button
          className="ob-cta"
          onClick={() => navigate("/how-it-works")}
          id="ob-features-next"
        >
          Continue
          <ArrowRight />
        </button>
      </div>
    </div>
  );
};

export default FeaturesPage;
