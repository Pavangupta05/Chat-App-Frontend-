import { useNavigate } from "react-router-dom";
import { UserPlus, MessageSquare, Zap, ArrowRight } from "lucide-react";
import "./Onboarding.css";

const steps = [
  {
    number: 1,
    icon: <UserPlus />,
    title: "Create your account",
    desc: "Sign up in seconds with your email or Google account — no phone number required.",
  },
  {
    number: 2,
    icon: <MessageSquare />,
    title: "Start a conversation",
    desc: "Find friends, create chats, and send your first message instantly.",
  },
  {
    number: 3,
    icon: <Zap />,
    title: "Connect in real time",
    desc: "Enjoy lightning-fast messaging, voice calls, and media sharing — all in one place.",
  },
];

const HowItWorksPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Mark onboarding as seen so user goes straight to login next time
    try {
      localStorage.setItem("ob-seen", "1");
    } catch {
      // silent
    }
    navigate("/login");
  };

  return (
    <div className="ob-page">
      <div className="ob-glow-orb ob-glow-orb--1" />
      <div className="ob-glow-orb ob-glow-orb--2" />

      <nav className="ob-nav">
        <span className="ob-nav__brand">TalkNow+</span>
        <button
          className="ob-nav__skip"
          onClick={handleGetStarted}
          id="ob-how-skip"
        >
          Skip
        </button>
      </nav>

      {/* Progress dots */}
      <div className="ob-progress">
        <div className="ob-progress__dot is-done" />
        <div className="ob-progress__dot is-done" />
        <div className="ob-progress__dot is-active" />
      </div>

      <div className="ob-content ob-page-enter" style={{ gap: "20px" }}>
        <p className="ob-tagline">How it works</p>

        <h1 className="ob-title">
          Three simple <span>steps</span>
        </h1>

        <p className="ob-subtitle" style={{ marginBottom: "16px" }}>
          Getting started takes less than a minute
        </p>

        <div className="ob-steps">
          {steps.map((s) => (
            <div className="ob-step" key={s.number} id={`ob-step-${s.number}`}>
              <div className="ob-step__number">{s.number}</div>
              <div className="ob-step__body">
                <h3 className="ob-step__title">{s.title}</h3>
                <p className="ob-step__desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ob-footer">
        <button
          className="ob-cta"
          onClick={handleGetStarted}
          id="ob-final-cta"
        >
          Let's Go
          <ArrowRight />
        </button>
        <p className="ob-footer__hint">You're all set — let's dive in!</p>
      </div>
    </div>
  );
};

export default HowItWorksPage;
