import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/app";
import { useAuth } from "../context/AuthContext";

function useSocket() {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [connectionError, setConnectionError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState("");

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const nextSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    const handleConnect = () => {
      console.log("✅ Socket connected successfully:", nextSocket.id);
      setConnectionError("");
      setIsConnected(true);
      setSocketId(nextSocket.id ?? "");
    };

    const handleConnectError = (error) => {
      console.log("❌ Socket connection error:", error);
      // Only show error message if it's a critical authentication error
      if (error?.message?.includes("Authentication")) {
        setConnectionError("Authentication failed. Please log in again.");
      } else {
        // Silently retry for connection issues
        setConnectionError("");
      }
    };

    const handleDisconnect = () => {
      console.log("🔌 Socket disconnected");
      setIsConnected(false);
      setSocketId("");
    };

    const handleReconnectAttempt = () => {
      console.log("🔄 Attempting to reconnect...");
    };

    socketRef.current = nextSocket;
    nextSocket.on("connect", handleConnect);
    nextSocket.on("connect_error", handleConnectError);
    nextSocket.on("disconnect", handleDisconnect);
    nextSocket.on("reconnect_attempt", handleReconnectAttempt);

    return () => {
      nextSocket.off("connect", handleConnect);
      nextSocket.off("connect_error", handleConnectError);
      nextSocket.off("disconnect", handleDisconnect);
      nextSocket.off("reconnect_attempt", handleReconnectAttempt);
      nextSocket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const emit = useCallback((eventName, payload) => {
    socketRef.current?.emit(eventName, payload);
  }, []);

  const subscribe = useCallback((eventName, handler) => {
    const socket = socketRef.current;

    if (!socket) {
      return () => {};
    }

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, []);

  return {
    connectionError,
    emit,
    subscribe,
    isConnected,
    socketId,
  };
}

export default useSocket;
