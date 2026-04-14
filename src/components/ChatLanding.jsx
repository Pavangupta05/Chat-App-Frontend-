import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

const ChatLanding = () => {
  return (
    <div className="chat-landing">

      {/* Animated background blobs */}
      <div className="chat-landing__blob chat-landing__blob--1" />
      <div className="chat-landing__blob chat-landing__blob--2" />

      <div className="chat-landing__content">
        {/* Illustration */}
        <motion.div
          className="chat-landing__illustration"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* SVG chat bubbles illustration */}
          <svg
            className="chat-landing__svg"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Left bubble */}
            <rect x="10" y="60" width="100" height="44" rx="22" fill="var(--bubble-received)" opacity="0.9" />
            <rect x="10" y="60" width="100" height="44" rx="22" fill="url(#grad1)" opacity="0.15" />
            <circle cx="22" cy="82" r="7" fill="var(--text-muted)" opacity="0.4" />
            <rect x="36" y="76" width="60" height="8" rx="4" fill="var(--text-muted)" opacity="0.35" />
            <rect x="36" y="88" width="42" height="6" rx="3" fill="var(--text-muted)" opacity="0.22" />
            {/* Tail */}
            <path d="M15 104 Q8 112 5 118 Q18 110 28 104Z" fill="var(--bubble-received)" opacity="0.9" />

            {/* Right bubble (outgoing) */}
            <rect x="90" y="24" width="100" height="44" rx="22" fill="url(#grad2)" />
            <rect x="104" y="38" width="60" height="8" rx="4" fill="rgba(255,255,255,0.55)" />
            <rect x="104" y="50" width="42" height="6" rx="3" fill="rgba(255,255,255,0.35)" />
            {/* Tail */}
            <path d="M185 68 Q192 76 195 82 Q182 74 172 68Z" fill="url(#grad2)" />

            {/* Small bottom bubble */}
            <rect x="30" y="118" width="70" height="30" rx="15" fill="var(--bubble-received)" opacity="0.6" />
            <rect x="43" y="127" width="44" height="6" rx="3" fill="var(--text-muted)" opacity="0.28" />
            <rect x="43" y="136" width="30" height="5" rx="2.5" fill="var(--text-muted)" opacity="0.18" />

            {/* Floating dots */}
            <circle cx="160" cy="130" r="5" fill="var(--accent)" opacity="0.3" />
            <circle cx="175" cy="120" r="3" fill="var(--accent)" opacity="0.2" />
            <circle cx="168" cy="140" r="2.5" fill="var(--accent)" opacity="0.15" />

            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="var(--accent)" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop stopColor="var(--accent)" />
                <stop offset="1" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>

          {/* Glow ring behind SVG */}
          <div className="chat-landing__glow" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="chat-landing__title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.55 }}
        >
          Start a conversation
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="chat-landing__subtitle"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5 }}
        >
          Select a chat from the sidebar to continue, or tap the{" "}
          <strong>+</strong> button to start a new conversation.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          className="chat-landing__pills"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {["✨ Rich media", "📞 Voice & Video", "👥 Group chats", "🔔 Notifications"].map((pill) => (
            <span key={pill} className="chat-landing__pill">{pill}</span>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        className="chat-landing__footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ delay: 0.7, duration: 1 }}
      >
        <Lock size={12} />
        <span>Your personal messages are end-to-end encrypted</span>
      </motion.div>
    </div>
  );
};

export default ChatLanding;
