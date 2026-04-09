import { useCallback, useEffect, useRef, useState } from "react";
import Peer from "simple-peer/simplepeer.min.js";
import { requestMediaStream, getPermissionErrorMessage, isSecureContext } from "../utils/mediaPermissions";

function useCall({ activeChatId, currentUserId, emit, socketId, subscribe, username }) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");
  const [callMode, setCallMode] = useState("video");
  const [callError, setCallError] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [activeCallSocketId, setActiveCallSocketId] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // "user" or "environment"
  const [secureContext, setSecureContext] = useState(isSecureContext());
  const [permissionRetryable, setPermissionRetryable] = useState(false);
  const peerRef = useRef(null);
  const callDurationIntervalRef = useRef(null);

  const stopLocalMedia = useCallback(() => {
    setLocalStream((currentStream) => {
      currentStream?.getTracks().forEach((track) => track.stop());
      return null;
    });
    setIsMuted(false);
    setIsCameraOff(false);
    setFacingMode("user");
  }, []);

  const stopTimer = useCallback(() => {
    window.clearInterval(callDurationIntervalRef.current);
    callDurationIntervalRef.current = null;
    setCallDuration(0);
  }, []);

  const resetCallState = useCallback(() => {
    peerRef.current?.destroy();
    peerRef.current = null;
    setIncomingCall(null);
    setRemoteStream(null);
    setCallStatus("idle");
    setCallMode("video");
    setActiveCallSocketId("");
    setPermissionRetryable(false);
    stopTimer();
    stopLocalMedia();
  }, [stopLocalMedia, stopTimer]);

  const startTimer = useCallback(() => {
    stopTimer();
    callDurationIntervalRef.current = window.setInterval(() => {
      setCallDuration((currentValue) => currentValue + 1);
    }, 1000);
  }, [stopTimer]);

  const ensureMediaStream = useCallback(async (mode, preferredFacingMode = "user") => {
    // If stream exists and we aren't changing facing mode, reuse it
    if (localStream && facingMode === preferredFacingMode) {
      return localStream;
    }

    // Stop old stream if it exists (relevant for flipping camera)
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await requestMediaStream({
        video: mode === "video" ? { facingMode: preferredFacingMode } : false,
        audio: true,
      });

      setLocalStream(stream);
      setFacingMode(preferredFacingMode);
      setPermissionRetryable(false);
      
      // If we were muted or camera was off, re-apply that to the new stream
      if (isMuted) {
        stream.getAudioTracks().forEach(t => t.enabled = false);
      }
      if (isCameraOff && mode === "video") {
        stream.getVideoTracks().forEach(t => t.enabled = false);
      }

      return stream;
    } catch (error) {
      const message = error.message || "";
      const isPermissionError = message.includes("Permission denied") || 
                                message.includes("NotAllowedError") ||
                                message.includes("PermissionDeniedError");
      
      setPermissionRetryable(isPermissionError);
      throw error;
    }
  }, [localStream, facingMode, isMuted, isCameraOff]);

  const bindPeerEvents = useCallback(
    (peer, remoteSocketId) => {
      peerRef.current = peer;
      setActiveCallSocketId(remoteSocketId ?? "");

      peer.on("stream", (stream) => {
        setRemoteStream(stream);
        setCallStatus("in-call");
        startTimer();
      });

      peer.on("close", resetCallState);

      peer.on("error", (error) => {
        console.error("Peer Error:", error);
        setCallError(error.message || "Call failed.");
        resetCallState();
      });
    },
    [resetCallState, startTimer],
  );

  useEffect(() => {
    return () => {
      window.clearInterval(callDurationIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!socketId) return undefined;

    const unsubscribeIncomingCall = subscribe("incoming_call", (payload) => {
      if (!payload || payload.callerSocketId === socketId) return;
      if (currentUserId && payload.receiverUserId && String(payload.receiverUserId) !== String(currentUserId)) return;

      setIncomingCall(payload);
      setCallMode(payload.mediaType === "audio" ? "audio" : "video");
      setCallError("");
      setCallStatus("ringing");
    });

    const unsubscribeAcceptedCall = subscribe("call_accepted", (payload) => {
      if (!payload || !peerRef.current) return;
      peerRef.current.signal(payload.signal);
      setActiveCallSocketId(payload.responderSocketId ?? "");
      setCallStatus("in-call");
      setCallMode(payload.mediaType === "audio" ? "audio" : "video");
      startTimer();
    });

    const unsubscribeEndCall = subscribe("end_call", () => resetCallState());

    return () => {
      unsubscribeIncomingCall();
      unsubscribeAcceptedCall();
      unsubscribeEndCall();
    };
  }, [currentUserId, resetCallState, socketId, startTimer, subscribe]);

  const startCall = useCallback(async (mode = "video") => {
    if (!activeChatId || callStatus === "calling" || callStatus === "in-call") return;

    try {
      setCallError("");
      setIncomingCall(null);
      setCallStatus("calling");
      setCallMode(mode);

      const stream = await ensureMediaStream(mode);
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      bindPeerEvents(peer, "");

      peer.on("signal", (signal) => {
        emit("call_user", {
          chatId: activeChatId,
          mediaType: mode,
          receiverUserId: activeChatId,
          callerUserId: currentUserId,
          signal,
          username,
        });
      });
    } catch (error) {
      console.error("❌ Call start error:", error);
      resetCallState();
      setCallError(getPermissionErrorMessage(error));
    }
  }, [activeChatId, bindPeerEvents, callStatus, emit, ensureMediaStream, currentUserId, resetCallState, username]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      setCallError("");
      const mode = incomingCall.mediaType === "audio" ? "audio" : "video";
      setCallMode(mode);
      const stream = await ensureMediaStream(mode);
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      bindPeerEvents(peer, incomingCall.callerSocketId);
      setCallStatus("in-call");

      peer.on("signal", (signal) => {
        emit("call_accepted", {
          chatId: incomingCall.chatId,
          mediaType: mode,
          signal,
          targetSocketId: incomingCall.callerSocketId,
          username,
        });
      });

      peer.signal(incomingCall.signal);
      setIncomingCall(null);
    } catch (error) {
      console.error("❌ Call accept error:", error);
      resetCallState();
      setCallError(getPermissionErrorMessage(error));
    }
  }, [bindPeerEvents, emit, ensureMediaStream, incomingCall, resetCallState, username]);

  const toggleMute = useCallback(() => {
    setLocalStream((currentStream) => {
      if (!currentStream) return currentStream;
      const nextMuted = !isMuted;
      currentStream.getAudioTracks().forEach((track) => track.enabled = !nextMuted);
      setIsMuted(nextMuted);
      return currentStream;
    });
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    setLocalStream((currentStream) => {
      if (!currentStream) return currentStream;
      const nextCameraOff = !isCameraOff;
      currentStream.getVideoTracks().forEach((track) => track.enabled = !nextCameraOff);
      setIsCameraOff(nextCameraOff);
      return currentStream;
    });
  }, [isCameraOff]);

  const flipCamera = useCallback(async () => {
    if (callMode !== "video") return;
    const nextFacingMode = facingMode === "user" ? "environment" : "user";
    
    try {
      const newStream = await ensureMediaStream("video", nextFacingMode);
      // Replace tracks in Peer if active
      if (peerRef.current) {
        const oldVideoTrack = localStream?.getVideoTracks()[0];
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (oldVideoTrack && newVideoTrack) {
          peerRef.current.replaceTrack(oldVideoTrack, newVideoTrack, localStream);
        }
      }
    } catch (e) {
      console.error("Failed to flip camera:", e);
    }
  }, [callMode, ensureMediaStream, facingMode, localStream]);

  const endCall = useCallback(() => {
    emit("end_call", {
      chatId: activeChatId,
      targetSocketId: activeCallSocketId || incomingCall?.callerSocketId,
      receiverUserId: incomingCall?.callerUserId || activeChatId,
      username,
    });
    resetCallState();
  }, [activeCallSocketId, activeChatId, emit, incomingCall, resetCallState, username]);

  return {
    acceptCall,
    callError,
    callDuration,
    callMode,
    callStatus,
    endCall,
    incomingCall,
    isMuted,
    isCameraOff,
    localStream,
    permissionRetryable,
    remoteStream,
    secureContext,
    startCall,
    toggleMute,
    toggleCamera,
    flipCamera,
  };
}

export default useCall;
