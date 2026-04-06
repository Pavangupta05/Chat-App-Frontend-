import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchMessagesBetween, fetchUserChats, isPeerMongoId } from "../services/messageService";
import useCall from "./useCall";
import useMessageStatus from "./useMessageStatus";
import useReply from "./useReply";
import useSocket from "./useSocket";
import useTyping from "./useTyping";
import {
  buildChat,
  buildFileMessage,
  buildTextMessage,
  formatTime,
} from "../utils/chat";

const getChatStorageKey = (userId) => `chat-app-state-${userId || "guest"}`;
const CHAT_STATE_VERSION = 2;

const loadStoredChatState = (userId) => {
  try {
    const key = getChatStorageKey(userId);
    const rawValue = window.sessionStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    if (parsedValue.version !== CHAT_STATE_VERSION || !Array.isArray(parsedValue.chats)) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
};

function useChatController() {
  const { token, user } = useAuth();
  const currentUserId = user?.id != null ? String(user.id) : "";
  const currentUsername = user?.username || "Anonymous";

  const [chats, setChats] = useState(() => {
    if (!currentUserId) return [];
    return loadStoredChatState(currentUserId)?.chats ?? [];
  });
  const [activeChatId, setActiveChatId] = useState(() => {
    if (!currentUserId) return null;
    return loadStoredChatState(currentUserId)?.activeChatId ?? null;
  });
  const [activeTab, setActiveTab] = useState(() => {
    if (!currentUserId) return "All Chats";
    return loadStoredChatState(currentUserId)?.activeTab ?? "All Chats";
  });
  const [newChatName, setNewChatName] = useState("");
  const [searchTerm, setSearchTerm] = useState(() => {
    if (!currentUserId) return "";
    return loadStoredChatState(currentUserId)?.searchTerm ?? "";
  });
  const [draftMessage, setDraftMessage] = useState("");
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const { emit, isConnected, socketId, subscribe } = useSocket();

  const createChatRecord = useCallback(
    ({ id, name, accent = "#69b2ff", avatar, createdAt, messages = [] }) => {
      const nameParts = name.trim().split(/\s+/);
      const resolvedAvatar =
        avatar ||
        nameParts
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join("") ||
        "NC";

      return buildChat({
        accent,
        avatar: resolvedAvatar,
        id,
        messages,
        name,
        updatedAt: createdAt,
      });
    },
    [],
  );

  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => b.updatedAt - a.updatedAt),
    [chats],
  );



  // Fetch all chats from the backend when the controller mounts or user changes
  useEffect(() => {
    if (!token || !currentUserId) return;
    
    fetchUserChats(token)
      .then((apiChats) => {
        setChats((existingLocalChats) => {
          const nextChats = [...existingLocalChats];
          let updated = false;
          
          apiChats.forEach((apiChat) => {
            // Find the remote peer safely (tolerate nulls if users were deleted)
            if (!apiChat?.participants || !Array.isArray(apiChat.participants)) return;
            const peer = apiChat.participants.find(p => p && String(p._id) !== currentUserId);
            if (!peer) return;
            
            const chatIdKey = String(peer._id);
            const alreadyExists = nextChats.some(c => String(c.id) === chatIdKey);
            
            if (!alreadyExists) {
              updated = true;
              nextChats.push(createChatRecord({
                id: chatIdKey,
                name: peer.username,
                createdAt: apiChat.updatedAt ? new Date(apiChat.updatedAt).getTime() : Date.now(),
                messages: [], // Real messages load on selectChat
              }));
            }
          });
          
          // Only trigger a re-render if we actually found missing historical chats
          return updated ? nextChats.sort((a, b) => b.updatedAt - a.updatedAt) : existingLocalChats;
        });
      })
      .catch((err) => {
        console.error("[chat] Failed to fetch user chats sync on mount:", err);
      });
  }, [token, currentUserId, createChatRecord]);

  useEffect(() => {
    if (!currentUserId) return;

    window.sessionStorage.setItem(
      getChatStorageKey(currentUserId),
      JSON.stringify({
        activeChatId,
        activeTab,
        chats,
        searchTerm,
        version: CHAT_STATE_VERSION,
      }),
    );
  }, [activeChatId, activeTab, chats, currentUserId, searchTerm]);

  const filteredChats = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    const applyTabFilter = (chat) =>
      activeTab === "All Chats" ||
      (activeTab === "Groups" && /team|group|studio|design/i.test(chat.name)) ||
      (activeTab === "Contacts" && !/team|group|studio|design/i.test(chat.name));

    return sortedChats.filter((chat) => {
      if (!applyTabFilter(chat)) {
        return false;
      }

      if (!normalizedTerm) {
        return true;
      }

      const lastMessage = chat.messages.at(-1);
      const searchableText = [chat.name, lastMessage?.text, lastMessage?.fileName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedTerm);
    });
  }, [activeTab, searchTerm, sortedChats]);

  const resolvedActiveChatId = chats.some((chat) => String(chat.id) === String(activeChatId))
    ? activeChatId
    : filteredChats[0]?.id ?? null;

  const activeChat =
    chats.find((chat) => String(chat.id) === String(resolvedActiveChatId)) ?? filteredChats[0] ?? null;

  // ── Reply hook ──────────────────────────────────────────────────────────────
  const { clearReply, replyMessage, setReplyMessage } = useReply();

  // ── Typing hook ─────────────────────────────────────────────────────────────
  const { clearTypingForChat, handleInputChange: handleTypingInputChange,
          startTyping, stopTyping, typingText } = useTyping({
    activeChatId: activeChat?.id ?? null,
    currentUsername,
    emit,
    setChats,
    subscribe,
  });

  // ── Message-status hook ─────────────────────────────────────────────────────
  const { markAsDelivered, markAsSeen } = useMessageStatus({
    activeChat,
    currentUserId,
    emit,
    setChats,
    subscribe,
  });

  useEffect(() => {
    if (!socketId) {
      return undefined;
    }

    const unsubscribeMessage = subscribe("receive_message", (payload) => {
      if (!payload || String(payload.senderUserId ?? "") === currentUserId) {
        return;
      }

      const receivedAt = Date.now();
      const nextMessage =
        payload.type === "file"
          ? buildFileMessage({
              deleted: payload.deleted ?? false,
              file: payload.file ?? "",
              fileName: payload.fileName ?? "",
              forwarded: payload.forwarded ?? false,
              id: payload.id ?? `incoming-file-${receivedAt}`,
              mimeType: payload.mimeType ?? "",
              sender: "other",
              senderSocketId: payload.senderSocketId ?? "",
              senderUserId: payload.senderUserId ?? "",
              time: payload.time ?? formatTime(receivedAt),
              username: payload.username ?? "Guest",
              chatId: payload.chatId,
            })
          : buildTextMessage({
              deleted: payload.deleted ?? false,
              forwarded: payload.forwarded ?? false,
              id: payload.id ?? `incoming-text-${receivedAt}`,
              sender: "other",
              senderSocketId: payload.senderSocketId ?? "",
              senderUserId: payload.senderUserId ?? "",
              text: payload.text ?? "",
              time: payload.time ?? formatTime(receivedAt),
              username: payload.username ?? "Guest",
              chatId: payload.chatId,
            });

      setChats((currentChats) =>
        currentChats.some((chat) => String(chat.id) === String(payload.chatId))
          ? currentChats.map((chat) =>
              String(chat.id) === String(payload.chatId)
                ? {
                    ...chat,
                    isTyping: false,
                    updatedAt: receivedAt,
                    unreadCount:
                      String(payload.chatId) === String(resolvedActiveChatId)
                        ? 0
                        : chat.unreadCount + 1,
                    messages: [...chat.messages, nextMessage],
                  }
                : chat,
            )
          : [
              createChatRecord({
                accent: payload.chatAccent,
                avatar: payload.chatAvatar,
                createdAt: receivedAt,
                id: payload.chatId,
                messages: [nextMessage],
                name: payload.chatName || payload.username || "New chat",
              }),
              ...currentChats,
            ],
      );

      // Clear typing for this user now that their message arrived
      clearTypingForChat(payload.chatId, payload.username);
    });

    const unsubscribeChatCreated = subscribe("chat_created", (payload) => {
      if (!payload?.id || !payload.name) {
        return;
      }

      setChats((currentChats) => {
        if (currentChats.some((chat) => String(chat.id) === String(payload.id))) {
          return currentChats;
        }

        return [
          createChatRecord({
            accent: payload.accent,
            avatar: payload.avatar,
            createdAt: payload.createdAt,
            id: payload.id,
            messages: payload.welcomeMessage
              ? [
                  buildTextMessage({
                    id: payload.welcomeMessage.id,
                    sender: "other",
                    text: payload.welcomeMessage.text,
                    time: payload.welcomeMessage.time,
                    username: payload.name,
                  }),
                ]
              : [],
            name: payload.name,
          }),
          ...currentChats,
        ];
      });
    });

    const unsubscribeMessageDeleted = subscribe("message_deleted", (payload) => {
      if (payload?.chatId == null || !payload?.messageId) {
        return;
      }

      setChats((currentChats) =>
        currentChats.map((chat) =>
          String(chat.id) === String(payload.chatId)
            ? {
                ...chat,
                messages: chat.messages.map((message) =>
                  message.id === payload.messageId
                    ? {
                        ...message,
                        deleted: true,
                        file: "",
                        fileName: "",
                        mimeType: "",
                        text: "",
                      }
                    : message,
                ),
              }
            : chat,
        ),
      );
    });

    return () => {
      unsubscribeMessage();
      unsubscribeChatCreated();
      unsubscribeMessageDeleted();
    };
  }, [
    clearTypingForChat,
    createChatRecord,
    currentUserId,
    resolvedActiveChatId,
    socketId,
    subscribe,
  ]);

  const selectChat = useCallback(
    (chatId) => {
      const idKey = String(chatId);
      setActiveChatId(chatId);
      setChats((currentChats) =>
        currentChats.map((chat) =>
          String(chat.id) === idKey ? { ...chat, unreadCount: 0, isTyping: false } : chat,
        ),
      );
      clearTypingForChat(chatId);
      clearReply();

      if (token && isPeerMongoId(idKey)) {
        fetchMessagesBetween(token, idKey)
          .then((rows) => {
            setChats((currentChats) =>
              currentChats.map((chat) =>
                String(chat.id) === idKey
                  ? {
                      ...chat,
                      messages: rows,
                      updatedAt: rows.length ? Date.now() : chat.updatedAt,
                    }
                  : chat,
              ),
            );
          })
          .catch((err) => {
            console.error("[chat] Failed to load messages:", err);
          });
      }
    },
    [clearReply, clearTypingForChat, token],
  );

  const createChat = useCallback(
    (chatInput) => {
      const isObj = chatInput && typeof chatInput === "object";
      const peerUserId = isObj && chatInput.peerUserId ? String(chatInput.peerUserId) : null;
      const trimmedName = (isObj ? chatInput.name : chatInput ?? newChatName).trim();
      const accentOverride = isObj ? chatInput.accent : null;
      const avatarOverride = isObj ? chatInput.avatar : null;

      if (!trimmedName) {
        return false;
      }

      const createdAt = Date.now();
      const chatId = peerUserId || createdAt;
      const welcomeMessage = buildTextMessage({
        id: `welcome-${createdAt}`,
        sender: "other",
        text: `${trimmedName} chat is ready. Say hello! 👋`,
        time: formatTime(createdAt),
        username: trimmedName,
      });
      const nextChat = createChatRecord({
        accent: accentOverride ?? undefined,
        avatar: avatarOverride ?? undefined,
        createdAt,
        id: chatId,
        messages: peerUserId ? [] : [welcomeMessage],
        name: trimmedName,
      });

      setChats((currentChats) => {
        if (peerUserId && currentChats.some((c) => String(c.id) === peerUserId)) {
          return currentChats;
        }
        return [nextChat, ...currentChats];
      });
      setActiveChatId(chatId);
      setActiveTab("All Chats");
      setSearchTerm("");
      setNewChatName("");

      if (peerUserId) {
        emit("create_chat", {
          accent: nextChat.accent,
          avatar: nextChat.avatar,
          createdAt,
          inviterName: currentUsername,
          peerUserId,
        });
      }

      if (peerUserId && token) {
        fetchMessagesBetween(token, peerUserId)
          .then((rows) => {
            setChats((currentChats) =>
              currentChats.map((chat) =>
                String(chat.id) === peerUserId
                  ? {
                      ...chat,
                      messages: rows,
                      updatedAt: rows.length ? Date.now() : chat.updatedAt,
                    }
                  : chat,
              ),
            );
          })
          .catch((err) => {
            console.error("[chat] Failed to load messages for new chat:", err);
          });
      }

      return true;
    },
    [createChatRecord, currentUsername, emit, newChatName, token],
  );


  const clearActiveChatMessages = useCallback(() => {
    if (!activeChat) {
      return;
    }

    setChats((currentChats) =>
      currentChats.map((chat) =>
        String(chat.id) === String(activeChat.id)
          ? {
              ...chat,
              unreadCount: 0,
              updatedAt: Date.now(),
              messages: [],
            }
          : chat,
      ),
    );
  }, [activeChat]);

  const deleteActiveChat = useCallback(() => {
    if (!activeChat) {
      return;
    }

    setChats((currentChats) =>
      currentChats.filter((chat) => String(chat.id) !== String(activeChat.id)),
    );
    setActiveChatId((currentId) => {
      if (String(currentId) !== String(activeChat.id)) {
        return currentId;
      }

      const remainingChat = chats.find((chat) => String(chat.id) !== String(activeChat.id));
      return remainingChat?.id ?? null;
    });
  }, [activeChat, chats]);

  const sendMessage = useCallback(() => {
    const text = draftMessage.trim();

    if (!text || !activeChat) {
      return;
    }

    const sentAt = Date.now();
    const replyTo = replyMessage ?? null;
    const messageId = `message-${sentAt}`;
    const payload = {
      chatAccent: activeChat.accent,
      chatAvatar: activeChat.avatar,
      chatId: activeChat.id,
      chatName: activeChat.name,
      id: messageId,
      receiverId: String(activeChat.id),
      replyTo,
      text,
      time: formatTime(sentAt),
      type: "text",
      username: currentUsername,
      forwarded: false,
    };

    setChats((currentChats) =>
      currentChats.map((chat) =>
        String(chat.id) === String(activeChat.id)
          ? {
              ...chat,
              isTyping: false,
              unreadCount: 0,
              updatedAt: sentAt,
              messages: [
                ...chat.messages,
                buildTextMessage({
                  chatId: activeChat.id,
                  id: payload.id,
                  replyTo,
                  sender: "me",
                  senderUserId: currentUserId,
                  text: payload.text,
                  time: payload.time,
                  username: currentUsername,
                  forwarded: false,
                }),
              ],
            }
          : chat,
      ),
    );

    emit("send_message", payload);
    stopTyping();
    clearReply();
    setDraftMessage("");
  }, [activeChat, clearReply, currentUserId, draftMessage, emit, replyMessage, stopTyping]);

  const sendFileMessage = useCallback((filePayload) => {
    if (!activeChat) {
      return;
    }

    const sentAt = Date.now();
    const payload = {
      chatAccent: activeChat.accent,
      chatAvatar: activeChat.avatar,
      chatId: activeChat.id,
      chatName: activeChat.name,
      file: filePayload.fileUrl,
      fileName: filePayload.fileName,
      id: `file-${sentAt}`,
      mimeType: filePayload.mimeType,
      receiverId: String(activeChat.id),
      time: formatTime(sentAt),
      type: "file",
      username: currentUsername,
      forwarded: false,
    };

    setChats((currentChats) =>
      currentChats.map((chat) =>
        String(chat.id) === String(activeChat.id)
          ? {
              ...chat,
              unreadCount: 0,
              updatedAt: sentAt,
              messages: [
                ...chat.messages,
                buildFileMessage({
                  file: payload.file,
                  fileName: payload.fileName,
                  id: payload.id,
                  mimeType: payload.mimeType,
                  sender: "me",
                  senderUserId: currentUserId,
                  time: payload.time,
                  username: currentUsername,
                  forwarded: false,
                }),
              ],
            }
          : chat,
      ),
    );

    emit("send_message", payload);
  }, [activeChat, currentUserId, emit]);

  const deleteMessageForMe = useCallback(
    (messageId) => {
      if (!activeChat) {
        return;
      }

      setChats((currentChats) =>
        currentChats.map((chat) =>
          String(chat.id) === String(activeChat.id)
            ? {
                ...chat,
                messages: chat.messages.filter((message) => message.id !== messageId),
              }
            : chat,
        ),
      );
    },
    [activeChat],
  );

  const deleteMessageForEveryone = useCallback(
    (messageId) => {
      if (!activeChat) {
        return;
      }

      setChats((currentChats) =>
        currentChats.map((chat) =>
          String(chat.id) === String(activeChat.id)
            ? {
                ...chat,
                messages: chat.messages.map((message) =>
                  message.id === messageId
                    ? {
                        ...message,
                        deleted: true,
                        file: "",
                        fileName: "",
                        mimeType: "",
                        text: "",
                      }
                    : message,
                ),
              }
            : chat,
        ),
      );

      emit("delete_message", {
        chatId: activeChat.id,
        messageId,
        receiverUserId: String(activeChat.id),
      });
    },
    [activeChat, emit],
  );

  const startForwardMessage = useCallback((message) => {
    setForwardingMessage(message);
  }, []);

  const cancelForwardMessage = useCallback(() => {
    setForwardingMessage(null);
  }, []);

  const forwardMessageToChat = useCallback(
    (targetChatId) => {
      if (!forwardingMessage) {
        return;
      }

      const targetChat = chats.find((chat) => String(chat.id) === String(targetChatId));

      if (!targetChat) {
        return;
      }

      const sentAt = Date.now();
      const payload = {
        chatAccent: targetChat.accent,
        chatAvatar: targetChat.avatar,
        chatId: targetChat.id,
        chatName: targetChat.name,
        file: forwardingMessage.file,
        fileName: forwardingMessage.fileName,
        forwarded: true,
        id: `forward-${sentAt}`,
        mimeType: forwardingMessage.mimeType,
        receiverId: String(targetChat.id),
        text: forwardingMessage.text,
        time: formatTime(sentAt),
        type: forwardingMessage.type,
        username: currentUsername,
      };

      setChats((currentChats) =>
        currentChats.map((chat) =>
          String(chat.id) === String(targetChat.id)
            ? {
                ...chat,
                unreadCount: 0,
                updatedAt: sentAt,
                messages: [
                  ...chat.messages,
                  payload.type === "file"
                    ? buildFileMessage({
                        file: payload.file,
                        fileName: payload.fileName,
                        forwarded: true,
                        id: payload.id,
                        mimeType: payload.mimeType,
                        sender: "me",
                        senderUserId: currentUserId,
                        time: payload.time,
                        username: currentUsername,
                      })
                    : buildTextMessage({
                        forwarded: true,
                        id: payload.id,
                        sender: "me",
                        senderUserId: currentUserId,
                        text: payload.text,
                        time: payload.time,
                        username: currentUsername,
                      }),
                ],
              }
            : chat,
        ),
      );

      emit("send_message", payload);
      setForwardingMessage(null);
    },
    [chats, currentUserId, emit, forwardingMessage],
  );

  const call = useCall({
    activeChatId: activeChat?.id,
    currentUserId,
    emit,
    socketId,
    subscribe,
    username: currentUsername,
  });

  const currentChat = activeChat
    ? {
        ...activeChat,
        lastSeen: isConnected ? activeChat.lastSeen : "Socket disconnected",
      }
    : null;

  return {
    activeTab,
    call,
    chats: filteredChats,
    clearActiveChatMessages,
    clearReply,
    createChat,
    currentChat,
    deleteActiveChat,
    deleteMessageForEveryone,
    deleteMessageForMe,
    draftMessage,
    forwardingMessage,
    handleTypingInputChange,
    markAsDelivered,
    markAsSeen,
    newChatName,
    replyMessage,
    searchTerm,
    sendFileMessage,
    sendMessage,
    selectChat,
    setReplyMessage,
    cancelForwardMessage,
    forwardMessageToChat,
    startForwardMessage,
    setActiveTab,
    setDraftMessage,
    setNewChatName,
    setSearchTerm,
    socketState: {
      connectionError: isConnected ? "" : "Realtime reconnecting",
      isConnected,
    },
    typing: {
      start: startTyping,
      stop: stopTyping,
      text: typingText,
    },
    username: currentUsername,
  };
}

export default useChatController;
