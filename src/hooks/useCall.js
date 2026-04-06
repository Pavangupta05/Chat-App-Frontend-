import { useCallback, useEffect, useRef, useState } from "react";
import Peer from "simple-peer/simplepeer.min.js";

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
  const peerRef = useRef(null);
  const callDurationIntervalRef = useRef(null);

  const stopLocalMedia = useCallback(() => {
    setLocalStream((currentStream) => {
      currentStream?.getTracks().forEach((track) => track.stop());
      return null;
    });
    setIsMuted(false);
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
    stopTimer();
    stopLocalMedia();
  }, [stopLocalMedia, stopTimer]);

  const startTimer = useCallback(() => {
    stopTimer();
    callDurationIntervalRef.current = window.setInterval(() => {
      setCallDuration((currentValue) => currentValue + 1);
    }, 1000);
  }, [stopTimer]);

  const ensureMediaStream = useCallback(async (mode) => {
    if (localStream) {
      return localStream;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: mode === "video",
      audio: true,
    });

    setLocalStream(stream);
    return stream;
  }, [localStream]);

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
    if (!socketId) {
      return undefined;
    }

    const unsubscribeIncomingCall = subscribe("incoming_call", (payload) => {
      if (!payload || payload.callerSocketId === socketId) {
        return;
      }
      if (currentUserId && payload.receiverUserId && String(payload.receiverUserId) !== String(currentUserId)) {
        return;
      }

      setIncomingCall(payload);
      setCallMode(payload.mediaType === "audio" ? "audio" : "video");
      setCallError("");
      setCallStatus("ringing");
    });

    const unsubscribeAcceptedCall = subscribe("call_accepted", (payload) => {
      if (!payload || !peerRef.current) {
        return;
      }

      peerRef.current.signal(payload.signal);
      setActiveCallSocketId(payload.responderSocketId ?? "");
      setCallStatus("in-call");
      setCallMode(payload.mediaType === "audio" ? "audio" : "video");
      startTimer();
    });

    const unsubscribeEndCall = subscribe("end_call", () => {
      resetCallState();
    });

    return () => {
      unsubscribeIncomingCall();
      unsubscribeAcceptedCall();
      unsubscribeEndCall();
    };
  }, [currentUserId, resetCallState, socketId, startTimer, subscribe]);

  const startCall = useCallback(async (mode = "video") => {
    if (!activeChatId || callStatus === "calling" || callStatus === "in-call") {
      return;
    }

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
      resetCallState();
      setCallError(error.message || "Unable to start the call.");
    }
  }, [
    activeChatId,
    bindPeerEvents,
    callStatus,
    emit,
    ensureMediaStream,
    currentUserId,
    resetCallState,
    username,
  ]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) {
      return;
    }

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
      resetCallState();
      setCallError(error.message || "Unable to accept the call.");
    }
  }, [bindPeerEvents, emit, ensureMediaStream, incomingCall, resetCallState, username]);

  const toggleMute = useCallback(() => {
    setLocalStream((currentStream) => {
      if (!currentStream) {
        return currentStream;
      }

      const nextMuted = !isMuted;
      currentStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
      setIsMuted(nextMuted);
      return currentStream;
    });
  }, [isMuted]);

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
    localStream,
    remoteStream,
    startCall,
    toggleMute,
  };
}

export default useCall;
