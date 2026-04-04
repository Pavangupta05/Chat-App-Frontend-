import { useEffect, useRef } from "react";

function formatDuration(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function AudioCallModal({
  callMode,
  audioStatus,
  callDuration,
  chatName,
  incomingCall,
  isMuted,
  localStream,
  onAcceptCall,
  onEndCall,
  onToggleMute,
  remoteStream,
}) {
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream ?? null;
    }
  }, [remoteStream]);

  if (callMode !== "audio") {
    return null;
  }

  if (audioStatus === "idle" && !incomingCall && !localStream && !remoteStream) {
    return null;
  }

  const title = incomingCall?.username || chatName || "Audio call";
  const statusLabel =
    audioStatus === "calling"
      ? "Calling..."
      : audioStatus === "in-call"
        ? "In Call"
        : incomingCall
          ? "Incoming audio call"
          : "Preparing microphone...";

  return (
    <div className="audio-call-modal" role="dialog" aria-modal="true" aria-label="Audio call">
      <div className="audio-call-modal__card">
        <div className="audio-call-modal__avatar" aria-hidden="true">
          {title.slice(0, 2).toUpperCase()}
        </div>
        <h3>{title}</h3>
        <p>{statusLabel}</p>
        <span>{audioStatus === "in-call" ? formatDuration(callDuration) : "00:00"}</span>

        <div className="audio-call-modal__controls">
          {incomingCall ? (
            <>
              <button className="call-button call-button--accept" type="button" onClick={onAcceptCall}>
                Accept
              </button>
              <button className="call-button call-button--end" type="button" onClick={onEndCall}>
                Reject
              </button>
            </>
          ) : (
            <>
              {audioStatus === "in-call" ? (
                <button
                  className={`call-button ${isMuted ? "call-button--muted" : "call-button--secondary"}`}
                  type="button"
                  onClick={onToggleMute}
                >
                  {isMuted ? "Unmute" : "Mute"}
                </button>
              ) : null}

              <button className="call-button call-button--end" type="button" onClick={onEndCall}>
                {audioStatus === "calling" ? "Cancel" : "End Call"}
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
