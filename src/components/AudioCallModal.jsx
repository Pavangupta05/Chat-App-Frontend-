import { useEffect, useRef, useState } from "react";
import { Minus, Maximize2, X } from "lucide-react";

function formatDuration(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function AudioCallModal({
  callError,
  callMode,
  audioStatus,
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream ?? null;
    }
  }, [remoteStream]);

  // Handle drag start
  const handleDragStart = (e) => {
    if (e.target.closest(".audio-call-modal__window-controls")) return;
    
    setIsDragging(true);
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    
    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.touches?.[0]?.clientY || 0;

      let newX = clientX - dragOffset.x;
      let newY = clientY - dragOffset.y;

      // Keep modal within viewport bounds
      const maxX = window.innerWidth - 320; // Modal width ~320px
      const maxY = window.innerHeight - 100;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, dragOffset]);

  if (callMode !== "audio") {
    return null;
  }

  if (audioStatus === "idle" && !incomingCall && !localStream && !remoteStream && !callError) {
    return null;
  }

  const title = incomingCall?.username || chatName || "Audio call";
  const statusLabel = callError
    ? callError
    : audioStatus === "calling"
      ? "Calling..."
      : audioStatus === "in-call"
        ? "In Call"
        : incomingCall
          ? "Incoming audio call"
          : "Preparing microphone...";

  // Minimized state: show compact bar
  if (isMinimized && audioStatus === "in-call") {
    return (
      <div 
        className="audio-call-modal audio-call-modal--minimized" 
        role="dialog" 
        aria-modal="true" 
        aria-label="Audio call minimized"
        style={{
          position: "fixed",
          top: `${position.y}px`,
          left: `${position.x}px`,
          zIndex: 5000,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        ref={modalRef}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="audio-call-modal__minimized-bar">
          <div className="audio-call-modal__minimized-info">
            <span className="audio-call-modal__minimized-name">{title}</span>
            <span className="audio-call-modal__minimized-duration">{formatDuration(callDuration)}</span>
          </div>
          <div className="audio-call-modal__minimized-controls">
            <button
              type="button"
              className="audio-call-modal__window-btn"
              onClick={() => setIsMinimized(false)}
              title="Expand call"
              aria-label="Expand call"
            >
              <Maximize2 size={16} />
            </button>
            <button
              type="button"
              className="audio-call-modal__window-btn"
              onClick={onEndCall}
              title="End call"
              aria-label="End call"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <audio ref={remoteAudioRef} autoPlay />
      </div>
    );
  }

  return (
    <div 
      className="audio-call-modal" 
      role="dialog" 
      aria-modal="true" 
      aria-label="Audio call"
      style={{
        position: "fixed",
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 5000,
        cursor: isDragging ? "grabbing" : "default",
        userSelect: isDragging ? "none" : "auto",
      }}
      ref={modalRef}
    >
      <div 
        className="audio-call-modal__card"
        style={{
          transition: isDragging ? "none" : "box-shadow 0.2s ease",
        }}
      >
        {/* Header with window controls */}
        <div 
          className="audio-call-modal__header"
          ref={headerRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
          }}
        >
          <div></div> {/* Spacer for alignment */}
          <div className="audio-call-modal__window-controls">
            {audioStatus === "in-call" && (
              <button
                type="button"
                className="audio-call-modal__window-btn"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
                aria-label="Minimize call window"
              >
                <Minus size={16} />
              </button>
            )}
            <button
              type="button"
              className="audio-call-modal__window-btn"
              onClick={onEndCall}
              title="Close"
              aria-label="Close call window"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="audio-call-modal__avatar" aria-hidden="true">
          {title.slice(0, 2).toUpperCase()}
        </div>

        {/* Caller info */}
        <h3 className="audio-call-modal__name">{title}</h3>
        <p className="audio-call-modal__status">{statusLabel}</p>

        {/* Call duration */}
        {audioStatus === "in-call" && (
          <span className="audio-call-modal__duration">{formatDuration(callDuration)}</span>
        )}

        {/* Security Warning */}
        {!secureContext && (
          <div style={{ color: "#ff6b6b", fontSize: "12px", marginBottom: "12px", background: "rgba(229, 57, 53, 0.1)", padding: "10px", borderRadius: "8px", textAlign: "center", border: "1px solid rgba(229, 57, 53, 0.3)" }}>
            ❌ Security Block: Phone browsers require HTTPS or Localhost for mic access.
          </div>
        )}

        {/* Control buttons */}
        <div className="audio-call-modal__controls">
          {incomingCall && audioStatus !== "calling" ? (
            <>
              <button 
                className="call-button call-button--accept" 
                type="button" 
                onClick={onAcceptCall}
                style={{ backgroundColor: "#22c55e", color: "white", padding: "10px 24px", borderRadius: "12px", border: "none", fontWeight: "600" }}
              >
                ✓ Accept
              </button>
              <button 
                className="call-button call-button--end" 
                type="button" 
                onClick={onEndCall}
                style={{ backgroundColor: "#ef4444", color: "white", padding: "10px 24px", borderRadius: "12px", border: "none", fontWeight: "600" }}
              >
                ✕ Reject
              </button>
            </>
          ) : permissionRetryable && callError && !localStream ? (
            <>
              <button
                className="call-button call-button--secondary"
                type="button"
                onClick={onRetryPermission}
              >
                🔄 Retry Permission
              </button>
              <button className="call-button call-button--end" type="button" onClick={onEndCall}>
                Cancel
              </button>
            </>
          ) : (
            <>
              {audioStatus === "in-call" ? (
                <button
                  className={`call-button ${isMuted ? "call-button--muted" : "call-button--secondary"}`}
                  type="button"
                  onClick={onToggleMute}
                  title={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMuted ? "🔇 Unmute" : "🎤 Mute"}
                </button>
              ) : null}

              <button className="call-button call-button--end" type="button" onClick={onEndCall}>
                ✕ {audioStatus === "calling" ? "Cancel" : "End Call"}
              </button>
            </>
          )}
        </div>

        <audio ref={remoteAudioRef} autoPlay />
      </div>
    </div>
  );
}

export default AudioCallModal;
