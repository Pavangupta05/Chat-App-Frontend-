import { useCallback, useEffect, useState } from "react";

/**
 * usePresence
 * Tracks which users are online/offline in real time.
 *
 * Returns:
 *   onlineUsers — Map<userId, { isOnline: boolean, lastSeen: Date|null }>
 *   isUserOnline(userId) — helper
 */
function usePresence({ subscribe }) {
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    const unsubOnline = subscribe("user_online", (payload) => {
      if (!payload?.userId) return;
      setOnlineUsers((prev) => ({
        ...prev,
        [String(payload.userId)]: { isOnline: true, lastSeen: null },
      }));
    });

    const unsubOffline = subscribe("user_offline", (payload) => {
      if (!payload?.userId) return;
      setOnlineUsers((prev) => ({
        ...prev,
        [String(payload.userId)]: {
          isOnline: false,
          lastSeen: payload.lastSeen ? new Date(payload.lastSeen) : new Date(),
        },
      }));
    });

    return () => {
      unsubOnline();
      unsubOffline();
    };
  }, [subscribe]);

  const isUserOnline = useCallback(
    (userId) => Boolean(onlineUsers[String(userId)]?.isOnline),
    [onlineUsers],
  );

  const getUserLastSeen = useCallback(
    (userId) => onlineUsers[String(userId)]?.lastSeen ?? null,
    [onlineUsers],
  );

  return { isUserOnline, getUserLastSeen, onlineUsers };
}

export default usePresence;
