import { useEffect, useRef } from "react";

function Call({
  callMode,
  callError,
  callStatus,
  incomingCall,
  localStream,
  onAcceptCall,
  onEndCall,
  onRetryPermission,
  permissionRetryable,
  remoteStream,
  secureContext,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream ?? null;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream ?? null;
    }
  }, [remoteStream]);

  if (callMode !== "video") {
    return null;
  }

  if (
    !incomingCall &&
    !localStream &&
    !remoteStream &&
    callStatus === "idle" &&
    !callError
  ) {
    return null;
  }

  const statusLabel =
    callStatus === "calling"
      ? "Calling..."
      : callStatus === "in-call"
        ? "Connected"
        : incomingCall
          ? `${incomingCall.username} is calling...`
          : "Preparing media...";

  return (
    <section className="call-panel">
      <div className="call-panel__stage">
        <div className="call-panel__remote">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline />
          ) : (
            <div className="call-panel__placeholder">
              <span>{statusLabel}</span>
              {incomingCall && <div className="call-panel__pulse" />}
            </div>
          )}
        </div>

        {localStream ? (
          <div className="call-panel__local">
            <video ref={localVideoRef} autoPlay muted playsInline />
          </div>
        ) : null}
      </div>

      <div className="call-panel__footer">
        {!secureContext && (
          <div className="call-panel__error" style={{ background: "rgba(255, 107, 107, 0.15)", padding: "12px", border: "1px solid #ff6b6b" }}>
            ⚠️ <strong>Insecure Context:</strong> Your browser blocks camera/mic on non-HTTPS origins (like your phone via IP). 
            Please use HTTPS or Localhost USB forwarding.
          </div>
        )}
        {callError && <p className="call-panel__error">{callError}</p>}

        <div className="call-panel__controls">
          {incomingCall && callStatus !== "calling" ? (
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
          ) : (incomingCall || callStatus === "calling" || callStatus === "in-call") ? (
            <button className="call-button call-button--end" type="button" onClick={onEndCall}>
              ✕ {callStatus === "calling" ? "Cancel" : "End Call"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default Call;
