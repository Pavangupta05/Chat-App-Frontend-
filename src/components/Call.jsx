import { useEffect, useRef } from "react";

function Call({
  callMode,
  callError,
  callStatus,
  incomingCall,
  localStream,
  onAcceptCall,
  onEndCall,
  remoteStream,
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
            <div className="call-panel__placeholder">{statusLabel}</div>
          )}
        </div>

        {localStream ? (
          <div className="call-panel__local">
            <video ref={localVideoRef} autoPlay muted playsInline />
          </div>
        ) : null}
      </div>

      <div className="call-panel__footer">
        <p>{callError || statusLabel}</p>

        <div className="call-panel__controls">
          {incomingCall ? (
            <button className="call-button call-button--accept" type="button" onClick={onAcceptCall}>
              Accept Call
            </button>
          ) : null}

          {(incomingCall || callStatus === "calling" || callStatus === "in-call") ? (
            <button className="call-button call-button--end" type="button" onClick={onEndCall}>
              End Call
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default Call;
