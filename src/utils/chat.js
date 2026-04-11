export const formatTime = (value) => {
  if (!value) return "";
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      // If it looks like an ISO string or similar but Date() failed, return as-is
      return typeof value === "string" ? value.split("T")[1]?.slice(0, 5) || value : String(value);
    }
    
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(date);
  } catch (err) {
    console.error("[formatTime] Error parsing date:", value, err);
    return String(value);
  }
};

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
  createdAt,
  username,
}) => ({
  chatId,
  createdAt: createdAt || Date.now(),
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
  createdAt,
  username,
}) => ({
  chatId,
  createdAt: createdAt || Date.now(),
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
    time: message.time ? formatTime(message.time) : "",
    username: message.username ?? "",
  };

  const text = message.text ?? message.message ?? "";
  const looksLikeFile = text.startsWith("/uploads/") || text.startsWith("http") && text.includes("/uploads/");

  if (message.type === "file" || message.file || looksLikeFile) {
    const filePath = message.file || text;
    return buildFileMessage({
      ...baseMessage,
      createdAt: message.createdAt ?? message.time ?? Date.now(),
      file: filePath,
      fileName: message.fileName || filePath.split("/").pop().split("?")[0],
      mimeType: message.mimeType ?? "",
    });
  }

  return buildTextMessage({
    ...baseMessage,
    createdAt: message.createdAt ?? message.time ?? Date.now(),
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
  peerId = null,
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
  peerId,
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

  const isFile = lastMessage?.type === "file" || lastMessage?.text?.startsWith("/uploads/");
  if (isFile) {
    const filePath = lastMessage.file || lastMessage.text || "";
    const isImg = (lastMessage.mimeType?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(filePath));
    const isVid = (lastMessage.mimeType?.startsWith("video/") || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(filePath));
    if (isImg) return "📷 Photo";
    if (isVid) return "🎥 Video";
    return `📎 ${lastMessage.fileName || filePath.split("/").pop().split("?")[0] || "File"}`;
  }

  return lastMessage?.text ?? "";
};
