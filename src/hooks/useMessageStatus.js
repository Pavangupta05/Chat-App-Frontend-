import { useCallback, useEffect } from "react";
import { updateMessageStatusInChats } from "../utils/chat";

function useMessageStatus({ activeChat, currentUserId, emit, setChats, subscribe }) {
  const updateStatus = useCallback(
    (chatId, messageId, status) => {
      if (!chatId || !messageId || !status) {
        return;
      }

      setChats((currentChats) =>
        updateMessageStatusInChats(currentChats, chatId, messageId, status),
      );
    },
    [setChats],
  );

  useEffect(() => {
    const unsubscribeSent = subscribe("message_sent", (payload) => {
      updateStatus(payload?.chatId, payload?.messageId, payload?.status ?? "sent");
    });

    const unsubscribeDelivered = subscribe("message_delivered", (payload) => {
      updateStatus(payload?.chatId, payload?.messageId, payload?.status ?? "delivered");
    });

    const unsubscribeSeen = subscribe("message_seen", (payload) => {
      updateStatus(payload?.chatId, payload?.messageId, payload?.status ?? "seen");
    });

    return () => {
      unsubscribeSent();
      unsubscribeDelivered();
      unsubscribeSeen();
    };
  }, [subscribe, updateStatus]);

  const markAsDelivered = useCallback(
    (message) => {
      if (!message?.chatId || !message?.id || !message.senderUserId || !currentUserId) {
        return;
      }

      updateStatus(message.chatId, message.id, "delivered");
      emit("message_delivered", {
        messageId: message.id,
        targetUserId: message.senderUserId,
        threadPeerId: currentUserId,
      });
    },
    [currentUserId, emit, updateStatus],
  );

  const markAsSeen = useCallback(
    (message) => {
      if (
        !message?.chatId ||
        !message?.id ||
        message.status === "seen" ||
        !message.senderUserId ||
        !currentUserId
      ) {
        return;
      }

      updateStatus(message.chatId, message.id, "seen");
      emit("message_seen", {
        messageId: message.id,
        targetUserId: message.senderUserId,
        threadPeerId: currentUserId,
      });
    },
    [currentUserId, emit, updateStatus],
  );

  useEffect(() => {
    if (!activeChat?.messages?.length) {
      return;
    }

    activeChat.messages.forEach((message) => {
      if (
        message.sender !== "me" &&
        !message.deleted &&
        message.status !== "seen" &&
        message.senderUserId
      ) {
        markAsSeen(message);
      }
    });
  }, [activeChat, markAsSeen]);

  return {
    markAsDelivered,
    markAsSeen,
    updateStatus,
  };
}

export default useMessageStatus;
