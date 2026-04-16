import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  PhoneOff, Mic, MicOff, Volume2, Video, MoreHorizontal,
  Share2, Bluetooth, ChevronDown, UserPlus, Phone,
  Lock, EyeOff, Maximize2, Minimize2, Delete
} from "lucide-react";
import "./Call.css";

/* ── Format mm:ss ───────────────────────────────────────────────── */
function formatDuration(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/* ── Keypad data ─────────────────────────────────────────────────── */
const KEYS = [
  { digit: "1", sub: "" },
  { digit: "2", sub: "ABC" },
  { digit: "3", sub: "DEF" },
  { digit: "4", sub: "GHI" },
  { digit: "5", sub: "JKL" },
  { digit: "6", sub: "MNO" },
  { digit: "7", sub: "PQRS" },
  { digit: "8", sub: "TUV" },
  { digit: "9", sub: "WXYZ" },
  { digit: "*", sub: "" },
  { digit: "0", sub: "+" },
  { digit: "#", sub: "" },
];

/* ── iOS spring config ───────────────────────────────────────────── */
const IOS_SPRING = { type: "spring", stiffness: 380, damping: 34, mass: 0.9 };
const IOS_SPRING_SOFT = { type: "spring", stiffness: 260, damping: 28, mass: 1 };

/* ── Signal quality indicator ───────────────────────────────────── */
function SignalBars({ quality = 3 }) {
  return (
    <div className="wa-signal" aria-label={`Signal: ${quality}/4`}>
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`wa-signal__bar ${bar <= quality ? "wa-signal__bar--active" : ""}`}
          style={{ height: `${5 + bar * 3}px` }}
        />
      ))}
    </div>
  );
}

/* ── Control button with iOS haptic-like feedback ────────────────── */
function CtrlBtn({ icon, label, onClick, active, muted, disabled }) {
  return (
    <div className="wa-call__ctrl-item">
      <motion.button
        className={`wa-call__ctrl-btn${active ? " wa-call__ctrl-btn--active" : ""}${muted ? " wa-call__ctrl-btn--muted" : ""}`}
        onClick={onClick}
        disabled={disabled}
        whileTap={{ scale: 0.84, opacity: 0.85 }}
        whileHover={{ scale: 1.06 }}
        transition={IOS_SPRING}
        aria-label={label}
      >
        {icon}
      </motion.button>
      <span>{label}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   AUDIO CALL MODAL — WhatsApp / iOS Style
   ══════════════════════════════════════════════════════════════════ */
function AudioCallModal({
  callError,
  callMode,
  callStatus,
  callDuration,
  chatName,
  incomingCall,
  isMuted,
  localStream,
  onAcceptCall,
  onEndCall,
  onRetryPermission,
  onToggleMute,
  permissionRetryable,
  remoteStream,
  secureContext,
}) {
  const remoteAudioRef = useRef(null);
  const [showKeypad, setShowKeypad]   = useState(false);
  const [dialInput, setDialInput]     = useState("");
  const [isSpeaker, setIsSpeaker]     = useState(false);
  const [isVideoOn, setIsVideoOn]     = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [signalQuality]               = useState(3); // Simulated

  /* Attach remote audio */
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      const playPromise = remoteAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.error("Audio play failed:", e));
      }
    }
  }, [remoteStream]);

  /* Reset on call end */
  useEffect(() => {
    if (callStatus === "idle") {
      setShowKeypad(false);
      setDialInput("");
    }
  }, [callStatus]);

  const handleKey = useCallback((digit) => setDialInput((p) => p + digit), []);
  const handleBackspace = useCallback(() => setDialInput((p) => p.slice(0, -1)), []);

  const callerName = incomingCall?.username ?? chatName ?? "Unknown";
  const initials   = callerName.slice(0, 2).toUpperCase();

  const statusLabel =
    callError         ? callError
    : callStatus === "calling"   ? "Calling…"
    : callStatus === "ringing"   ? "Ringing…"
    : callStatus === "in-call"   ? formatDuration(callDuration)
    : incomingCall               ? "Incoming call"
    : "Connecting…";

  const isVisible =
    callMode === "audio" &&
    (callStatus !== "idle" || !!incomingCall || !!callError);

  if (!isVisible) return null;

  /* ═══════════════════════════════════════════════════════════════
     INCOMING CALL — iOS style slide-up sheet
     ═══════════════════════════════════════════════════════════════ */
  if (incomingCall && callStatus !== "in-call" && callStatus !== "calling") {
    return (
      <AnimatePresence>
        <motion.div
          className="wa-call wa-call--incoming"
          initial={{ opacity: 0, scale: 0.94, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 40 }}
          transition={IOS_SPRING}
          role="dialog"
          aria-modal="true"
          aria-label="Incoming call"
        >
          <div className="wa-call__bg-blur" aria-hidden="true" />

          {/* Animated background rings */}
          <div className="wa-call__bg-rings" aria-hidden="true">
            {[0,1,2].map((i) => (
              <motion.div
                key={i}
                className="wa-call__bg-ring"
                animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0, 0.15] }}
                transition={{ duration: 2.2, delay: i * 0.7, repeat: Infinity }}
              />
            ))}
          </div>

          {/* Header */}
          <div className="wa-call__incoming-header">
            <div className="wa-call__enc-badge">
              <Lock size={11} />
              <span>End-to-end encrypted</span>
            </div>
          </div>

          {/* Caller info */}
          <div className="wa-call__caller-info">
            <p className="wa-call__incoming-label">
              {incomingCall?.mediaType === "audio" ? "📞 Incoming audio call" : "📞 Incoming call"}
            </p>
            <motion.div
              className="wa-call__avatar-ring"
              animate={{ boxShadow: [
                "0 0 0 0 rgba(34,197,94,0.4)",
                "0 0 0 20px rgba(34,197,94,0)",
              ]}}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              <div className="wa-call__avatar wa-call__avatar--large">{initials}</div>
            </motion.div>
            <h2 className="wa-call__name">{callerName}</h2>
            <p className="wa-call__subtext">ChatApp</p>
          </div>

          {/* Accept / Reject */}
          <div className="wa-call__incoming-actions">
            <div className="wa-call__action-item">
              <motion.button
                className="wa-call__action-btn wa-call__action-btn--reject"
                onClick={onEndCall}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.06 }}
                transition={IOS_SPRING}
                aria-label="Decline call"
              >
                <PhoneOff size={28} />
              </motion.button>
              <span>Decline</span>
            </div>
            <div className="wa-call__action-item">
              <motion.button
                className="wa-call__action-btn wa-call__action-btn--accept"
                onClick={onAcceptCall}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.06 }}
                animate={{ boxShadow: [
                  "0 0 0 0 rgba(34,197,94,0.5)",
                  "0 0 0 16px rgba(34,197,94,0)",
                ]}}
                transition={{ ...IOS_SPRING, boxShadow: { duration: 1.2, repeat: Infinity } }}
                aria-label="Accept call"
              >
                <Phone size={28} />
              </motion.button>
              <span>Accept</span>
            </div>
          </div>

          <audio ref={remoteAudioRef} autoPlay />
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     ACTIVE CALL SCREEN
     ═══════════════════════════════════════════════════════════════ */
  return (
    <AnimatePresence>
      <motion.div
        className="wa-call wa-call--active"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={IOS_SPRING_SOFT}
        role="dialog"
        aria-modal="true"
        aria-label="Audio call"
        onClick={() => setShowControls(true)}
      >
        <div className="wa-call__bg-blur" aria-hidden="true" />

        {/* Top bar */}
        <motion.div
          className="wa-call__topbar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...IOS_SPRING, delay: 0.12 }}
        >
          <motion.button
            className="wa-call__topbar-btn"
            onClick={onEndCall}
            whileTap={{ scale: 0.88 }}
            aria-label="Minimize"
          >
            <ChevronDown size={24} />
          </motion.button>

          <div className="wa-call__topbar-title">
            <span className="wa-call__name">{callerName}</span>
            <span className="wa-call__enc-inline">
              <Lock size={10} style={{ marginRight: 3 }} />
              End-to-end encrypted
            </span>
          </div>

          {/* Signal quality */}
          <div className="wa-call__topbar-right">
            {callStatus === "in-call" && <SignalBars quality={signalQuality} />}
          </div>
        </motion.div>

        {/* Center — Avatar + Status */}
        <div className="wa-call__center">
          {(callStatus === "calling" || callStatus === "ringing") && (
            <>
              <motion.div className="wa-call__pulse wa-call__pulse--1"
                animate={{ scale: [1, 1.18], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div className="wa-call__pulse wa-call__pulse--2"
                animate={{ scale: [1, 1.18], opacity: [0.35, 0] }}
                transition={{ duration: 2, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div className="wa-call__pulse wa-call__pulse--3"
                animate={{ scale: [1, 1.18], opacity: [0.2, 0] }}
                transition={{ duration: 2, delay: 1.2, repeat: Infinity, ease: "easeOut" }}
              />
            </>
          )}

          <motion.div
            className="wa-call__avatar wa-call__avatar--large"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...IOS_SPRING, delay: 0.08 }}
          >
            {initials}
          </motion.div>

          <motion.div
            className="wa-call__status-block"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...IOS_SPRING, delay: 0.18 }}
          >
            {/* In-call: large timer */}
            {callStatus === "in-call" ? (
              <p className="wa-call__timer">{formatDuration(callDuration)}</p>
            ) : (
              <p className="wa-call__status">{statusLabel}</p>
            )}
          </motion.div>

          {/* Warnings */}
          {!secureContext && (
            <div className="wa-call__warning">
              ❌ Mic requires HTTPS on mobile browsers
            </div>
          )}
          {callError && <div className="wa-call__warning">{callError}</div>}
          {permissionRetryable && callError && (
            <motion.button
              className="wa-call__retry-btn"
              onClick={onRetryPermission}
              whileTap={{ scale: 0.94 }}
            >
              🔄 Retry Permission
            </motion.button>
          )}
        </div>

        {/* ── KEYPAD PANEL ──────────────────────────────────────── */}
        <AnimatePresence>
          {showKeypad && (
            <motion.div
              className="wa-keypad"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={IOS_SPRING}
            >
              <div className="wa-keypad__display">
                <span className="wa-keypad__input">{dialInput || ""}</span>
                <AnimatePresence>
                  {dialInput && (
                    <motion.button
                      className="wa-keypad__back"
                      onClick={handleBackspace}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      whileTap={{ scale: 0.82 }}
                      transition={IOS_SPRING}
                      aria-label="Backspace"
                    >
                      <Delete size={20} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <div className="wa-keypad__grid">
                {KEYS.map(({ digit, sub }, idx) => (
                  <motion.button
                    key={digit}
                    className="wa-keypad__key"
                    onClick={() => handleKey(digit)}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...IOS_SPRING, delay: idx * 0.025 }}
                    whileTap={{ scale: 0.84, backgroundColor: "rgba(255,255,255,0.22)" }}
                    aria-label={`Dial ${digit}`}
                  >
                    <span className="wa-keypad__digit">{digit}</span>
                    {sub && <span className="wa-keypad__sub">{sub}</span>}
                  </motion.button>
                ))}
              </div>

              <motion.button
                className="wa-keypad__close"
                onClick={() => setShowKeypad(false)}
                whileTap={{ scale: 0.88 }}
                aria-label="Close keypad"
              >
                <ChevronDown size={22} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CALL CONTROLS (Glass Panel) ──────────────────────── */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="wa-call__controls"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ ...IOS_SPRING, delay: 0.1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="wa-call-grid">
                {/* Audio/Speaker */}
                <div className="wa-call-grid-item">
                  <button 
                    type="button" 
                    className={`wa-call-grid-btn ${isSpeaker ? 'is-white' : ''}`}
                    onClick={() => setIsSpeaker(!isSpeaker)}
                  >
                    {isSpeaker ? <Volume2 size={24} /> : <Bluetooth size={24} />}
                  </button>
                  <span className="wa-call-grid-label">Audio</span>
                </div>

                {/* Video Switch */}
                <div className="wa-call-grid-item">
                  <button 
                    type="button" 
                    className={`wa-call-grid-btn ${isVideoOn ? 'is-white' : ''}`}
                    onClick={() => setIsVideoOn(!isVideoOn)}
                  >
                    <Video size={24} />
                  </button>
                  <span className="wa-call-grid-label">Video</span>
                </div>

                {/* Mute */}
                <div className="wa-call-grid-item">
                  <button 
                    type="button" 
                    className={`wa-call-grid-btn ${isMuted ? 'is-white' : ''}`}
                    onClick={onToggleMute}
                  >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                  <span className="wa-call-grid-label">Mute</span>
                </div>

                {/* Hide */}
                <div className="wa-call-grid-item">
                  <button 
                    type="button" 
                    className="wa-call-grid-btn"
                    onClick={() => setShowControls(false)}
                  >
                    <EyeOff size={24} />
                  </button>
                  <span className="wa-call-grid-label">Hide</span>
                </div>

                {/* Share */}
                <div className="wa-call-grid-item">
                  <button type="button" className="wa-call-grid-btn">
                    <Share2 size={22} />
                  </button>
                  <span className="wa-call-grid-label">Share</span>
                </div>

                {/* End Call */}
                <div className="wa-call-grid-item">
                  <button 
                    type="button" 
                    className="wa-call-grid-btn is-danger"
                    onClick={onEndCall}
                  >
                    <PhoneOff size={24} />
                  </button>
                  <span className="wa-call-grid-label">End</span>
                </div>
              </div>
          </motion.div>
        )}
        </AnimatePresence>

        <audio ref={remoteAudioRef} autoPlay />
      </motion.div>
    </AnimatePresence>
  );
}

export default AudioCallModal;
