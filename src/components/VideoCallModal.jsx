import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, RefreshCcw,
  ChevronDown, Bluetooth, Volume2, MoreHorizontal, Share2, Phone, Lock
} from "lucide-react";

function formatDuration(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const IOS_SPRING      = { type: "spring", stiffness: 380, damping: 34, mass: 0.9 };
const IOS_SPRING_SOFT = { type: "spring", stiffness: 260, damping: 28, mass: 1 };

function CtrlBtn({ icon, label, onClick, active, muted, stopProp }) {
  return (
    <div className="wa-call__ctrl-item">
      <motion.button
        className={`wa-call__ctrl-btn${active ? " wa-call__ctrl-btn--active" : ""}${muted ? " wa-call__ctrl-btn--muted" : ""}`}
        onClick={(e) => { if (stopProp) e.stopPropagation(); onClick?.(); }}
        whileTap={{ scale: 0.84 }}
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

function VideoCallModal({
  callError, callMode, callStatus, callDuration,
  chatName, incomingCall, isMuted, isCameraOff,
  localStream, remoteStream,
  onAcceptCall, onEndCall, onRetryPermission,
  onToggleMute, onToggleCamera, onFlipCamera,
  permissionRetryable, secureContext,
}) {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef(null);

  useEffect(() => {
    if (localVideoRef.current)  localVideoRef.current.srcObject  = localStream  ?? null;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream ?? null;
  }, [remoteStream]);

  const revealControls = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (callStatus === "in-call") {
      hideTimer.current = setTimeout(() => setShowControls(false), 4500);
    }
  };

  useEffect(() => {
    if (callStatus === "in-call") {
      hideTimer.current = setTimeout(() => setShowControls(false), 4500);
    } else {
      setShowControls(true);
    }
    return () => clearTimeout(hideTimer.current);
  }, [callStatus]);

  const callerName = incomingCall?.username ?? chatName ?? "Unknown";
  const initials   = callerName.slice(0, 2).toUpperCase();

  const isVisible =
    callMode === "video" &&
    (callStatus !== "idle" || !!incomingCall || !!callError);

  if (!isVisible) return null;

  /* ─── INCOMING VIDEO CALL ─────────────────────────────────────── */
  if (incomingCall && callStatus !== "in-call" && callStatus !== "calling") {
    return (
      <motion.div
        className="wa-call wa-call--incoming"
        initial={{ opacity: 0, scale: 0.94, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 40 }}
        transition={IOS_SPRING}
        role="dialog" aria-modal="true" aria-label="Incoming video call"
      >
        <div className="wa-call__bg-blur" aria-hidden="true" />

        {/* Animated rings */}
        <div className="wa-call__bg-rings" aria-hidden="true">
          {[0,1,2].map((i) => (
            <motion.div
              key={i} className="wa-call__bg-ring"
              animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0, 0.15] }}
              transition={{ duration: 2.2, delay: i * 0.7, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="wa-call__incoming-header">
          <div className="wa-call__enc-badge">
            <Lock size={11} /><span>End-to-end encrypted</span>
          </div>
        </div>

        <div className="wa-call__caller-info">
          <p className="wa-call__incoming-label">📹 Incoming video call</p>
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

        <div className="wa-call__incoming-actions">
          <div className="wa-call__action-item">
            <motion.button
              className="wa-call__action-btn wa-call__action-btn--reject"
              onClick={onEndCall}
              whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06 }}
              transition={IOS_SPRING} aria-label="Decline"
            >
              <PhoneOff size={28} />
            </motion.button>
            <span>Decline</span>
          </div>
          <div className="wa-call__action-item">
            <motion.button
              className="wa-call__action-btn wa-call__action-btn--accept"
              onClick={onAcceptCall}
              whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06 }}
              animate={{ boxShadow: [
                "0 0 0 0 rgba(34,197,94,0.5)",
                "0 0 0 16px rgba(34,197,94,0)",
              ]}}
              transition={{ ...IOS_SPRING, boxShadow: { duration: 1.2, repeat: Infinity } }}
              aria-label="Accept video call"
            >
              <Video size={28} />
            </motion.button>
            <span>Accept</span>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ─── ACTIVE VIDEO CALL ───────────────────────────────────────── */
  return (
    <motion.div
      className="wa-video-call"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={revealControls}
      role="dialog" aria-modal="true" aria-label="Video call"
    >
      {/* Remote video */}
      {remoteStream ? (
        <video ref={remoteVideoRef} className="wa-video-call__remote" autoPlay playsInline />
      ) : (
        <div className="wa-video-call__placeholder">
          {(callStatus === "calling" || callStatus === "ringing") && (
            <>
              <motion.div className="wa-call__pulse wa-call__pulse--1"
                animate={{ scale: [1,1.18], opacity:[0.5,0] }}
                transition={{ duration:2, repeat:Infinity, ease:"easeOut" }}
              />
              <motion.div className="wa-call__pulse wa-call__pulse--2"
                animate={{ scale: [1,1.18], opacity:[0.35,0] }}
                transition={{ duration:2, delay:0.6, repeat:Infinity, ease:"easeOut" }}
              />
              <motion.div className="wa-call__pulse wa-call__pulse--3"
                animate={{ scale:[1,1.18], opacity:[0.2,0] }}
                transition={{ duration:2, delay:1.2, repeat:Infinity, ease:"easeOut" }}
              />
            </>
          )}
          <motion.div
            className="wa-call__avatar wa-call__avatar--large"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={IOS_SPRING}
          >
            {initials}
          </motion.div>
          <motion.p
            className="wa-call__status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...IOS_SPRING, delay: 0.15 }}
            style={{ marginTop: 16 }}
          >
            {callError || (callStatus === "calling" ? "Calling…" : callStatus === "ringing" ? "Ringing…" : "Connecting…")}
          </motion.p>
        </div>
      )}

      {/* PiP local video */}
      <AnimatePresence>
        {localStream && !isCameraOff && (
          <motion.div
            className="wa-video-call__pip"
            drag dragMomentum={false} dragElastic={0.08}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={IOS_SPRING}
            onClick={(e) => e.stopPropagation()}
          >
            <video ref={localVideoRef} className="wa-video-call__pip-video" autoPlay muted playsInline />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="wa-video-call__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {/* Top bar */}
            <motion.div
              className="wa-call__topbar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...IOS_SPRING, delay: 0.06 }}
            >
              <motion.button
                className="wa-call__topbar-btn"
                onClick={(e) => { e.stopPropagation(); onEndCall(); }}
                whileTap={{ scale: 0.88 }}
                aria-label="Back"
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
              <div style={{ width: 40 }} />
            </motion.div>

            {/* Timer badge */}
            <AnimatePresence>
              {callStatus === "in-call" && remoteStream && (
                <motion.div
                  className="wa-video-call__status-badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={IOS_SPRING}
                >
                  {formatDuration(callDuration)}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {callError && (
              <div className="wa-call__warning" style={{ margin: "0 20px" }}>
                {callError}
              </div>
            )}
            {!secureContext && (
              <div className="wa-call__warning" style={{ margin: "0 20px" }}>
                ❌ Camera/mic requires HTTPS on mobile
              </div>
            )}

            {/* Controls panel */}
            <motion.div
              className="wa-call__controls"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...IOS_SPRING, delay: 0.1 }}
            >
              <div className="wa-call__controls-row">
                <CtrlBtn stopProp
                  icon={isSpeaker ? <Volume2 size={24}/> : <Bluetooth size={24}/>}
                  label={isSpeaker ? "Speaker" : "Audio"}
                  active={isSpeaker}
                  onClick={() => setIsSpeaker(v => !v)}
                />
                <CtrlBtn stopProp
                  icon={isCameraOff ? <VideoOff size={24}/> : <Video size={24}/>}
                  label={isCameraOff ? "Cam Off" : "Video"}
                  muted={isCameraOff}
                  onClick={onToggleCamera}
                />
                <CtrlBtn stopProp
                  icon={isMuted ? <MicOff size={24}/> : <Mic size={24}/>}
                  label={isMuted ? "Unmute" : "Mute"}
                  muted={isMuted}
                  onClick={onToggleMute}
                />
              </div>

              <div className="wa-call__controls-row">
                <CtrlBtn stopProp icon={<MoreHorizontal size={24}/>} label="More" onClick={() => {}} />
                <CtrlBtn stopProp
                  icon={<RefreshCcw size={24}/>}
                  label="Flip"
                  onClick={onFlipCamera}
                />
                <CtrlBtn stopProp icon={<Share2 size={24}/>} label="Share" onClick={() => {}} />
              </div>

              <div className="wa-call__end-row">
                <motion.button
                  className="wa-call__end-btn"
                  onClick={(e) => { e.stopPropagation(); onEndCall(); }}
                  whileTap={{ scale: 0.84 }}
                  whileHover={{ scale: 1.06 }}
                  transition={IOS_SPRING}
                  aria-label="End call"
                >
                  <PhoneOff size={28} />
                </motion.button>
                <span className="wa-call__end-label">End</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission retry */}
      {permissionRetryable && callError && (
        <motion.div
          style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:20 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={IOS_SPRING}
        >
          <button className="wa-call__retry-btn" onClick={onRetryPermission}>
            🔄 Retry Permission
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default VideoCallModal;
