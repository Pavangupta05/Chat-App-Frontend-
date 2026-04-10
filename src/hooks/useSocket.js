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
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const nextSocket = io(SOCKET_URL, {
      // Try WebSocket first, fall back to polling if it fails
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10, // Increased attempts
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000, // Max 5 seconds between retries
      timeout: 20000,
      // Additional connection options for stability
      forceNew: false,
      multiplex: true,
    });

    const handleConnect = () => {
      console.log("✅ Socket connected successfully:", nextSocket.id);
      console.log("🌐 Transport method:", nextSocket.io.engine.transport.name);
      setConnectionError("");
      setIsConnected(true);
      setSocketId(nextSocket.id ?? "");
      reconnectAttemptRef.current = 0; // Reset counter on successful connection
    };

    const handleConnectError = (error) => {
      console.warn("❌ Socket connection error:", error);
      reconnectAttemptRef.current += 1;
      
      // Only show error message if it's a critical authentication error
      if (error?.message?.includes("Authentication")) {
        setConnectionError("Authentication failed. Please log in again.");
      } else if (reconnectAttemptRef.current > 5) {
        // Show error after multiple failed attempts
        setConnectionError("Connection unstable. Using fallback connection...");
      } else {
        // Silently retry for connection issues
        setConnectionError("");
      }
    };

    const handleDisconnect = (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
      setSocketId("");
      
      // Don't set error for normal disconnects (like page reload)
      if (reason !== "io client namespace disconnect") {
        setConnectionError("");
      }
    };

    const handleReconnectAttempt = () => {
      const attempt = reconnectAttemptRef.current + 1;
      console.log(`🔄 Reconnection attempt ${attempt}...`);
    };

    const handleTransportError = (error) => {
      console.warn("🚨 Transport error:", error);
      // Fallback to polling will be automatic
    };

    const handleError = (error) => {
      console.error("⚠️ Socket error:", error);
    };

    socketRef.current = nextSocket;
    nextSocket.on("connect", handleConnect);
    nextSocket.on("connect_error", handleConnectError);
    nextSocket.on("disconnect", handleDisconnect);
    nextSocket.on("reconnect_attempt", handleReconnectAttempt);
    nextSocket.on("transport error", handleTransportError);
    nextSocket.on("error", handleError);

    return () => {
      nextSocket.off("connect", handleConnect);
      nextSocket.off("connect_error", handleConnectError);
      nextSocket.off("disconnect", handleDisconnect);
      nextSocket.off("reconnect_attempt", handleReconnectAttempt);
      nextSocket.off("transport error", handleTransportError);
      nextSocket.off("error", handleError);
      nextSocket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const emit = useCallback((...args) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(...args);
    } else {
      console.warn("❌ Cannot emit event - socket not connected:", args[0]);
    }
  }, []);

  const subscribe = useCallback((eventName, handler) => {
    const socket = socketRef.current;

    if (!socket) {
      console.warn("❌ Cannot subscribe - socket not initialized:", eventName);
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
