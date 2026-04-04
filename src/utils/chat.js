export const formatTime = (value) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);

export const formatListTime = (value) => {
  const messageDate = new Date(value);
  const now = new Date();

  if (messageDate.toDateString() !== now.toDateString()) {
    return "Yesterday";
  }

  return formatTime(value);
};

export const buildTextMessage = ({
  chatId = null,
  deleted = false,
  forwarded = false,
  id,
  replyTo = null,
  sender,
  senderSocketId = "",
  senderUserId = "",
  status = sender === "me" ? "sent" : "delivered",
  text,
  time,
  username,
}) => ({
  chatId,
  deleted,
  forwarded,
  id,
  replyTo,
  sender,
  senderSocketId,
  senderUserId,
  status,
  text,
  time,
  type: "text",
  username,
});

export const buildFileMessage = ({
  chatId = null,
  deleted = false,
  file,
  fileName,
  forwarded = false,
  id,
  mimeType,
  replyTo = null,
  sender,
  senderSocketId = "",
  senderUserId = "",
  status = sender === "me" ? "sent" : "delivered",
  time,
  username,
}) => ({
  chatId,
  deleted,
  id,
  file,
  fileName,
  forwarded,
  mimeType,
  replyTo,
  sender,
  senderSocketId,
  senderUserId,
  status,
  time,
  type: "file",
  username,
});

export const buildReplyPreview = (message) => {
  if (!message) {
    return null;
  }

  return {
    id: message.id,
    message:
      message.type === "file"
        ? message.fileName || "Shared file"
        : message.deleted
          ? "This message was deleted"
          : message.text || "",
    type: message.type,
    username: message.username || (message.sender === "me" ? "You" : "Unknown"),
  };
};

export const normalizeMessage = (message, chatId) => {
  const baseMessage = {
    chatId: message.chatId ?? chatId ?? null,
    deleted: Boolean(message.deleted),
    forwarded: Boolean(message.forwarded),
    id: message.id,
    replyTo: message.replyTo ?? null,
    sender: message.sender ?? "other",
    senderSocketId: message.senderSocketId ?? "",
    senderUserId: message.senderUserId ?? "",
    status:
      message.status ??
      ((message.sender ?? "other") === "me" ? "sent" : "delivered"),
    time: message.time ?? "",
    username: message.username ?? "",
  };

  if (message.type === "file" || message.file) {
    return buildFileMessage({
      ...baseMessage,
      file: message.file ?? "",
      fileName: message.fileName ?? "",
      mimeType: message.mimeType ?? "",
    });
  }

  return buildTextMessage({
    ...baseMessage,
    text: message.text ?? message.message ?? "",
  });
};

export const updateMessageStatusInChats = (chats, chatId, messageId, status) =>
  chats.map((chat) =>
    String(chat.id) === String(chatId)
      ? {
          ...chat,
          messages: chat.messages.map((message) =>
            message.id === messageId ? { ...message, status } : message,
          ),
        }
      : chat,
  );

export const buildChat = ({
  accent = "#69b2ff",
  avatar = "NC",
  id,
  isTyping = false,
  lastSeen = "Last seen recently",
  messages = [],
  name,
  status = "offline",
  unreadCount = 0,
  updatedAt,
}) => ({
  accent,
  avatar,
  id,
  isTyping,
  lastSeen,
  messages,
  name,
  status,
  unreadCount,
  updatedAt,
});

export const getTypingText = (users) => {
  if (users.length > 1) {
    return "Multiple users are typing...";
  }

  if (users.length === 1) {
    return `${users[0]} is typing...`;
  }

  return "";
};

export const getChatPreview = (chat) => {
  const lastMessage = chat.messages.at(-1);

  if (chat.isTyping) {
    return `${chat.name.split(" ")[0]} is typing...`;
  }

  if (lastMessage?.deleted) {
    return "This message was deleted";
  }

  if (lastMessage?.type === "file") {
    return lastMessage.fileName || "Shared a file";
  }

  return lastMessage?.text ?? "";
};
