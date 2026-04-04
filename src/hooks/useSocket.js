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
      transports: ["websocket", "polling"],
      auth: { token },
    });

    const handleConnect = () => {
      setConnectionError("");
      setIsConnected(true);
      setSocketId(nextSocket.id ?? "");
    };
    const handleConnectError = (error) => {
      setConnectionError(error.message || "Unable to connect to the socket server.");
    };
    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId("");
    };

    socketRef.current = nextSocket;
    nextSocket.on("connect", handleConnect);
    nextSocket.on("connect_error", handleConnectError);
    nextSocket.on("disconnect", handleDisconnect);

    return () => {
      nextSocket.off("connect", handleConnect);
      nextSocket.off("connect_error", handleConnectError);
      nextSocket.off("disconnect", handleDisconnect);
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
