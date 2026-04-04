import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTypingText } from "../utils/chat";

function useTyping({ activeChatId, currentUsername, emit, setChats, subscribe }) {
  const [typingUsers, setTypingUsers] = useState({});
  const stopTypingTimeoutRef = useRef(null);

  const syncChatTypingState = useCallback(
    (nextTypingUsers) => {
      setChats((currentChats) =>
        currentChats.map((chat) => ({
          ...chat,
          isTyping: Boolean(nextTypingUsers[String(chat.id)]?.length),
        })),
      );
    },
    [setChats],
  );

  useEffect(() => {
    const unsubscribeTyping = subscribe("typing", (payload) => {
      const chatKey = payload?.chatId != null ? String(payload.chatId) : "";
      if (!chatKey || payload.username === currentUsername) {
        return;
      }

      setTypingUsers((currentUsers) => {
        const nextUsers = { ...currentUsers };
        const usersInChat = new Set(nextUsers[chatKey] ?? []);
        usersInChat.add(payload.username);
        nextUsers[chatKey] = [...usersInChat];
        syncChatTypingState(nextUsers);
        return nextUsers;
      });
    });

    const unsubscribeStopTyping = subscribe("stop_typing", (payload) => {
      const chatKey = payload?.chatId != null ? String(payload.chatId) : "";
      if (!chatKey) {
        return;
      }

      setTypingUsers((currentUsers) => {
        const nextUsers = { ...currentUsers };
        nextUsers[chatKey] = (nextUsers[chatKey] ?? []).filter(
          (username) => username !== payload.username,
        );
        syncChatTypingState(nextUsers);
        return nextUsers;
      });
    });

    return () => {
      unsubscribeTyping();
      unsubscribeStopTyping();
    };
  }, [currentUsername, subscribe, syncChatTypingState]);

  useEffect(() => {
    return () => {
      window.clearTimeout(stopTypingTimeoutRef.current);
    };
  }, []);

  const stopTyping = useCallback(() => {
    if (!activeChatId) {
      return;
    }

    window.clearTimeout(stopTypingTimeoutRef.current);
    emit("stop_typing", {
      chatId: activeChatId,
      receiverId: activeChatId,
      username: currentUsername,
    });
  }, [activeChatId, currentUsername, emit]);

  const startTyping = useCallback(() => {
    if (!activeChatId) {
      return;
    }

    emit("typing", {
      chatId: activeChatId,
      receiverId: activeChatId,
      username: currentUsername,
    });

    window.clearTimeout(stopTypingTimeoutRef.current);
    stopTypingTimeoutRef.current = window.setTimeout(() => {
      emit("stop_typing", {
        chatId: activeChatId,
        receiverId: activeChatId,
        username: currentUsername,
      });
    }, 400);
  }, [activeChatId, currentUsername, emit]);

  const handleInputChange = useCallback(
    (nextValue) => {
      if (nextValue.trim()) {
        startTyping();
        return;
      }

      stopTyping();
    },
    [startTyping, stopTyping],
  );

  const clearTypingForChat = useCallback(
    (chatId, usernameToRemove = null) => {
      const key = chatId != null ? String(chatId) : "";
      if (!key) {
        return;
      }
      setTypingUsers((currentUsers) => {
        const nextUsers = { ...currentUsers };
        nextUsers[key] = usernameToRemove
          ? (nextUsers[key] ?? []).filter((username) => username !== usernameToRemove)
          : [];
        syncChatTypingState(nextUsers);
        return nextUsers;
      });
    },
    [syncChatTypingState],
  );

  const typingText = useMemo(() => {
    const key = activeChatId != null ? String(activeChatId) : "";
    return getTypingText(key ? typingUsers[key] ?? [] : []);
  }, [activeChatId, typingUsers]);

  return {
    clearTypingForChat,
    handleInputChange,
    startTyping,
    stopTyping,
    typingText,
  };
}

export default useTyping;
