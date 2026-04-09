import { useEffect, useRef, useState } from "react";
import { 
  Minus, 
  Maximize2, 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff,
  RefreshCcw,
  Maximize
} from "lucide-react";

function formatDuration(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function VideoCallModal({
  callError,
  callMode,
  callStatus,
  callDuration,
  chatName,
  incomingCall,
  isMuted,
  isCameraOff,
  localStream,
  remoteStream,
  onAcceptCall,
  onEndCall,
  onRetryPermission,
  onToggleMute,
  onToggleCamera,
  onFlipCamera,
  permissionRetryable,
  secureContext,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

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

  // Handle drag start
  const handleDragStart = (e) => {
    if (e.target.closest("button")) return;
    
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

      // Bounds check
      const maxX = window.innerWidth - (isMinimized ? 150 : 320);
      const maxY = window.innerHeight - (isMinimized ? 200 : 400);

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => setIsDragging(false);

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
  }, [isDragging, dragOffset, isMinimized]);

  if (callMode !== "video") return null;
  if (callStatus === "idle" && !incomingCall && !localStream && !remoteStream && !callError) return null;

  const title = incomingCall?.username || chatName || "Video Call";
  
  // Render Minimized (PiP style)
  if (isMinimized && callStatus === "in-call") {
    return (
      <div 
        className="video-call-modal video-call-modal--minimized"
        style={{
          position: "fixed",
          top: `${position.y}px`,
          left: `${position.x}px`,
          zIndex: 5100,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="video-call-modal__pip">
          <video ref={remoteVideoRef} autoPlay playsInline className="video-call-modal__video-bg" />
          <div className="video-call-modal__pip-overlay">
            <button onClick={() => setIsMinimized(false)} className="video-call-modal__pip-btn">
              <Maximize size={16} />
            </button>
            <button onClick={onEndCall} className="video-call-modal__pip-btn video-call-modal__pip-btn--danger">
              <PhoneOff size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`video-call-modal ${isDragging ? "video-call-modal--dragging" : ""}`}
      style={{
        position: "fixed",
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 5100,
      }}
      ref={modalRef}
    >
      <div className="video-call-modal__content">
        {/* Header Area (Draggable) */}
        <div 
          className="video-call-modal__header"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="video-call-modal__title">
            <span className="video-call-modal__status-dot"></span>
            {title} {callStatus === "in-call" && `(${formatDuration(callDuration)})`}
          </div>
          <div className="video-call-modal__window-controls">
            {callStatus === "in-call" && (
              <button onClick={() => setIsMinimized(true)} className="video-call-modal__win-btn">
                <Minus size={18} />
              </button>
            )}
            <button onClick={onEndCall} className="video-call-modal__win-btn">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Stage */}
        <div className="video-call-modal__stage">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="video-call-modal__video-remote" />
          ) : (
            <div className="video-call-modal__placeholder">
              <div className="video-call-modal__avatar">{title[0].toUpperCase()}</div>
              <p>{callError || (callStatus === "calling" ? "Calling..." : "Connecting...")}</p>
            </div>
          )}

          {localStream && (
            <div className="video-call-modal__local-container">
              <video ref={localVideoRef} autoPlay muted playsInline className="video-call-modal__video-local" />
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="video-call-modal__footer">
          {incomingCall && callStatus !== "calling" ? (
            <div className="video-call-modal__actions">
              <button onClick={onAcceptCall} className="v-btn v-btn--accept">Accept</button>
              <button onClick={onEndCall} className="v-btn v-btn--decline">Decline</button>
            </div>
          ) : (
            <div className="video-call-modal__controls-row">
              <button onClick={onToggleMute} className={`v-control-btn ${isMuted ? "v-control-btn--active" : ""}`}>
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button onClick={onToggleCamera} className={`v-control-btn ${isCameraOff ? "v-control-btn--active" : ""}`}>
                {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
              <button onClick={onFlipCamera} className="v-control-btn">
                <RefreshCcw size={20} />
              </button>
              <button onClick={onEndCall} className="v-control-btn v-control-btn--danger">
                <PhoneOff size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoCallModal;
