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
}) {
  const remoteAudioRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream ?? null;
    }
  }, [remoteStream]);

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
    <div className="audio-call-modal" role="dialog" aria-modal="true" aria-label="Audio call">
      <div className="audio-call-modal__card">
        {/* Header with window controls */}
        <div className="audio-call-modal__header">
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

        {/* Control buttons */}
        <div className="audio-call-modal__controls">
          {incomingCall && audioStatus !== "calling" ? (
            <>
              <button className="call-button call-button--accept" type="button" onClick={onAcceptCall}>
                ✓ Accept
              </button>
              <button className="call-button call-button--end" type="button" onClick={onEndCall}>
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
