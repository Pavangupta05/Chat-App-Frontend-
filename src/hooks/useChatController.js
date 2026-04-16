import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchMessagesByChatId, fetchMessagesBetween, fetchUserChats, isPeerMongoId, clearChatHistory, deleteChat, deleteSingleMessage, deleteMessageForEveryoneApi, createGroupChatApi, addMembersToGroupApi, updateGroupSettingsApi } from "../services/messageService";
import useCall from "./useCall";
import useMessageStatus from "./useMessageStatus";
import useNotifications from "./useNotifications";
import usePresence from "./usePresence";
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
    const rawValue = window.localStorage.getItem(key);

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
  const { token, user, updateUser } = useAuth();
  const currentUserId = user?.id != null ? String(user.id) : "";
  const currentUsername = user?.username || "Anonymous";

  const [chats, setChats] = useState(() => {
    if (!currentUserId) return [];
    return loadStoredChatState(currentUserId)?.chats ?? [];
  });
  const [activeChatId, setActiveChatId] = useState(null); // Managed by URL or user action
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
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [loadMessagesError, setLoadMessagesError] = useState(null);
  const { emit, isConnected, socketId, subscribe } = useSocket();
  const { isUserOnline, getUserLastSeen } = usePresence({ subscribe });
  const { notify } = useNotifications();

  const createChatRecord = useCallback(
    ({ id, name, accent = "#69b2ff", avatar, createdAt, messages = [], peerId = null }) => {
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
        peerId: peerId || (isPeerMongoId(String(id)) ? String(id) : null),
        updatedAt: createdAt,
        isGroupChat: !!peerId ? false : true, // Heuristic: if no peerId, it's a group (will be corrected by sync)
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
        setChats((currentLocal) => {
          const next = [...currentLocal];
          let updated = false;

          apiChats.forEach((apiChat) => {
            const isGroup = apiChat.isGroupChat;
            const realChatId = String(apiChat._id);
            
            let name, avatar, peerUserId = null;

            if (isGroup) {
              name = apiChat.chatName || "Unknown Group";
              avatar = apiChat.groupAvatar && !apiChat.groupAvatar.match(/^https?:\/\//) && !apiChat.groupAvatar.startsWith("/uploads") ? apiChat.groupAvatar : null;
            } else {
              const peer = apiChat.participants.find(p => p && String(p._id) !== currentUserId);
              if (!peer) return;
              
              // CRITICAL FIX: If Google OAuth or broken backend previously saved a profile URL directly into peer.username, intercept it!
              let cleanUsername = peer.username;
              if (cleanUsername && (cleanUsername.match(/^https?:\/\//) || cleanUsername.startsWith("/uploads"))) {
                cleanUsername = null; 
              }

              name = cleanUsername || peer.name || "Google User";
              
              // Don't use raw URLs as text avatars
              avatar = peer.profilePic && !peer.profilePic.match(/^https?:\/\//) && !peer.profilePic.startsWith("/uploads") ? peer.profilePic : null;
              peerUserId = String(peer._id);
            }

            // SMART MERGE: Check if we have this chat by Real ID OR by Peer User ID
            const existingIndex = next.findIndex(c => String(c.id) === realChatId || (peerUserId && String(c.id) === peerUserId));

            if (existingIndex !== -1) {
              const existing = next[existingIndex];
              const isIdMismatch = String(existing.id) !== realChatId;
              
              // Synchronize profile details
              const isProfileStale = (existing.name !== name && name) || (existing.avatar !== avatar && avatar);
              const isGroupMetaStale = isGroup && (existing.groupAdmin !== apiChat.groupAdmin?._id || existing.anyoneCanAdd !== apiChat.anyoneCanAdd);

              if (isIdMismatch || isProfileStale || isGroupMetaStale) {
                if (isIdMismatch) {
                  console.log(`[SmartSync] Merging local chat ${existing.id} -> ${realChatId}`);
                  setActiveChatId((currentId) => String(currentId) === String(existing.id) ? realChatId : currentId);
                }

                next[existingIndex] = { 
                  ...existing, 
                  id: realChatId, 
                  peerId: peerUserId,
                  name: name || existing.name || "Unknown User",
                  avatar: avatar || existing.avatar || null,
                  isGroupChat: isGroup,
                  groupAdmin: isGroup ? String(apiChat.groupAdmin?._id || apiChat.groupAdmin || "") : null,
                  anyoneCanAdd: apiChat.anyoneCanAdd ?? true,
                  groupAccent: apiChat.groupAccent,
                  updatedAt: isIdMismatch && apiChat.updatedAt ? new Date(apiChat.updatedAt).getTime() : existing.updatedAt 
                };
                updated = true;
              }
            } else {
              updated = true;
              next.push(createChatRecord({
                id: realChatId,
                peerId: peerUserId,
                name: name,
                avatar: avatar,
                createdAt: apiChat.updatedAt ? new Date(apiChat.updatedAt).getTime() : Date.now(),
              }));
              
              const lastIdx = next.length - 1;
              next[lastIdx].isGroupChat = isGroup;
              next[lastIdx].groupAdmin = isGroup ? String(apiChat.groupAdmin?._id || apiChat.groupAdmin || "") : null;
              next[lastIdx].anyoneCanAdd = apiChat.anyoneCanAdd ?? true;
              next[lastIdx].groupAccent = apiChat.groupAccent;
            }
          });

          return updated ? [...next].sort((a, b) => b.updatedAt - a.updatedAt) : currentLocal;
        });
      })
      .catch((err) => {
        console.error("[chat] Failed to fetch user chats sync on mount:", err);
      });
  }, [token, currentUserId, createChatRecord]);

  useEffect(() => {
    if (!currentUserId) return;

    // Debounce localStorage update to avoid infinite update loop
    const handler = setTimeout(() => {
      window.localStorage.setItem(
        getChatStorageKey(currentUserId),
        JSON.stringify({
          activeChatId,
          activeTab,
          chats,
          searchTerm,
          version: CHAT_STATE_VERSION,
        }),
      );
    }, 100);
    return () => clearTimeout(handler);
  }, [activeChatId, activeTab, chats, currentUserId, searchTerm]);

  const filteredChats = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    return sortedChats.filter((chat) => {
      if (activeTab === "Groups" && !chat.isGroupChat) return false;
      if (activeTab === "Contacts" && chat.isGroupChat) return false;

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

  // We resolve the ID strictly ONLY for the actual data lookup,
  // but we keep activeChatId for UI selection state persistence correctly.
  const activeChat =
    chats.find((chat) => String(chat.id) === String(activeChatId)) ?? null;

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
              time: formatTime(payload.time ?? receivedAt),
              createdAt: payload.createdAt || payload.time || receivedAt,
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
              time: formatTime(payload.time ?? receivedAt),
              createdAt: payload.createdAt || payload.time || receivedAt,
              username: payload.username ?? "Guest",
              chatId: payload.chatId,
            });

      setChats((currentChats) => {
        // 🧩 SMART MATCH: Try matching by chatId OR by peerId (the sender)
        const chatIndex = currentChats.findIndex(
          (chat) => 
            String(chat.id) === String(payload.chatId) || 
            String(chat.peerId) === String(payload.senderUserId)
        );

        if (chatIndex !== -1) {
          return currentChats.map((chat, idx) => {
            if (idx !== chatIndex) return chat;

            // IDENTITY SYNC: If we matched by peerId, but the chat ID is different (Room ID vs User ID), 
            // we update the local ID to the server's Room ID to ensure perfect future sync.
            const updatedId = String(payload.chatId);
            if (String(chat.id) !== updatedId) {
              console.log(`[IdentitySync] Updating chat ID: ${chat.id} -> ${updatedId}`);
              
              // Handle activeChatId redirection if the synced chat was active
              setActiveChatId(currentId => String(currentId) === String(chat.id) ? updatedId : currentId);
            }

            return {
              ...chat,
              id: updatedId,
              isTyping: false,
              updatedAt: receivedAt,
              unreadCount:
                String(updatedId) === String(activeChatId)
                  ? 0
                  : chat.unreadCount + 1,
              messages: [...chat.messages, nextMessage],
            };
          });
        }

        // New chat record if no match found
        return [
          createChatRecord({
            peerId: payload.senderUserId,
            accent: payload.chatAccent,
            avatar: payload.chatAvatar,
            createdAt: receivedAt,
            id: payload.chatId,
            messages: [nextMessage],
            name: payload.chatName || payload.username || "New chat",
          }),
          ...currentChats,
        ];
      });

      // Browser notification when tab is hidden
      notify({
        title: payload.username || "New Message",
        body: payload.text || (payload.type === "file" ? "📎 Sent a file" : ""),
      });

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
            peerId: payload.peerUserId || payload.id, 
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
    
    // 👤 Listen for profile updates from other users
    const handleProfileUpdate = (payload) => {
      if (!payload?.userId) return;
      
      const updatedUserId = String(payload.userId);
      const avatarUrl = payload.profilePic || payload.avatar;
      
      // If it's the current user, sync global Auth context
      if (updatedUserId === currentUserId) {
        updateUser({
          username: payload.username,
          profilePic: avatarUrl
        });
        return;
      }

      setChats((currentChats) =>
        currentChats.map((chat) =>
          String(chat.id) === updatedUserId
            ? {
                ...chat,
                name: payload.username || chat.name,
                avatar: avatarUrl || chat.avatar,
              }
            : chat
        )
      );
    };

    const unsubscribeUserUpdated = subscribe("user_updated", handleProfileUpdate);
    const unsubscribeProfileUpdated = subscribe("profileUpdated", handleProfileUpdate);

    return () => {
      unsubscribeMessage();
      unsubscribeChatCreated();
      unsubscribeMessageDeleted();
      unsubscribeUserUpdated();
      unsubscribeProfileUpdated();
    };
  }, [
    clearTypingForChat,
    createChatRecord,
    currentUserId,
    activeChatId,
    socketId,
    subscribe,
  ]);

  // 🚪 JOIN/LEAVE ROOM logic — Essential for real-time delivery
  useEffect(() => {
    if (!socketId || !activeChatId) return;
    
    // Peer IDs (local) vs Mongo IDs (backend). 
    // Usually, we only join rooms for synced backend chats.
    if (isPeerMongoId(String(activeChatId))) {
      console.log(`🔌 [socket] Joining room: ${activeChatId}`);
      emit("join_chat", { chatId: activeChatId });
      
      return () => {
        console.log(`🔌 [socket] Leaving room: ${activeChatId}`);
        emit("leave_chat", { chatId: activeChatId });
      };
    }
  }, [activeChatId, socketId, emit]);

  const selectChat = useCallback(
    (chatId) => {
      if (chatId === null) {
        setActiveChatId(null);
        clearReply();
        return;
      }

      const idKey = String(chatId);
      
      console.log("🔍 [chat] Selecting Chat ID:", idKey);
      console.log("🔍 [chat] Active User ID:", currentUserId);
      
      // Reset state when switching chats
      setActiveChatId(chatId);
      clearReply();
      clearTypingForChat(chatId);
      
      setChats((currentChats) => {
        const index = currentChats.findIndex((c) => String(c.id) === idKey);
        if (index === -1) return currentChats;

        const chat = currentChats[index];
        // Reset unread count and typing indicator when switching to this chat
        const nextChats = [...currentChats];
        nextChats[index] = { 
          ...chat, 
          unreadCount: 0, 
          isTyping: false 
        };
        return nextChats;
      });

       // Load messages for the selected chat
       if (token && isPeerMongoId(idKey)) {
         setIsLoadingMessages(true);
         setLoadMessagesError(null);
 
         fetchMessagesByChatId(token, idKey)
            .then((msgs) => {
              setChats((currentChats) =>
                currentChats.map((chat) => {
                  if (String(chat.id) !== idKey) return chat;

                  // 🧩 Merge logic: Preserve optimistic messages that aren't in the server's list yet
                  const serverMsgIds = new Set(msgs.map(m => String(m.id)));
                  const optimisticMessages = chat.messages.filter(m => 
                    !serverMsgIds.has(String(m.id)) && 
                    (String(m.id).startsWith('message-') || String(m.id).startsWith('file-'))
                  );

                  return {
                    ...chat,
                    messages: [...msgs, ...optimisticMessages],
                    updatedAt: chat.messages.length === 0 && msgs.length > 0 ? Date.now() : chat.updatedAt,
                  };
                }),
              );
              setIsLoadingMessages(false);
            })
           .catch((err) => {
             console.error("[chat] Failed to load messages for chat:", idKey, err);
             // FIX: Only show error UI for genuine access-denied situations (typed error from messageService).
             // For transient network errors, fail silently so the chat view stays usable.
             // Never redirect or reset navigation from here.
             if (err.code === "ACCESS_DENIED") {
               if (err.status === 404) {
                 console.warn("[chat] 404 chat fetch (optimistic/deleted). Ignoring to prevent flash.");
                 setLoadMessagesError(null);
               } else {
                 setLoadMessagesError("Access denied. You are not a participant in this conversation.");
               }
             } else {
               // Transient error — log but don't show error UI (chat may still work via socket)
               console.warn("[chat] Transient fetch error, not showing error UI:", err.message);
               setLoadMessagesError(null);
             }
             setIsLoadingMessages(false);
           });
       }
    },
    [clearReply, clearTypingForChat, currentUserId, token],
  );

  const createChat = useCallback(
    async (chatInput) => {
      const isObj = chatInput && typeof chatInput === "object";
      const peerUserId = isObj && chatInput.peerUserId ? String(chatInput.peerUserId) : null;
      const trimmedName = (isObj ? chatInput.name : chatInput ?? newChatName).trim();
      const accentOverride = isObj ? chatInput.accent : null;
      const avatarOverride = isObj ? chatInput.avatar : null;

      if (!trimmedName) {
        return false;
      }

      let backendGroupId = null;
      let fullGroupData = null;

      // If peerUserId is missing, this is a Group Chat Creation request using the backend!
      if (!peerUserId && token) {
         try {
           const { createGroupChatApi } = await import("../services/messageService.js");
           const res = await createGroupChatApi(token, {
              name: trimmedName,
              users: chatInput.members || [],
              accent: accentOverride,
              avatar: avatarOverride,
           });
           if (res && res._id) {
             backendGroupId = String(res._id);
             fullGroupData = res;
           } else {
             return false;
           }
         } catch (e) {
           console.error("Group creation failed:", e);
           return false;
         }
      }

      const createdAt = Date.now();
      const chatId = backendGroupId || peerUserId || createdAt;
      const welcomeMessage = buildTextMessage({
        id: `welcome-${createdAt}`,
        sender: "other",
        text: `${trimmedName} chat is ready. Say hello! 👋`,
        time: formatTime(createdAt),
        username: trimmedName,
      });
      const nextChat = createChatRecord({
        accent: accentOverride || (fullGroupData?.groupAccent) || undefined,
        avatar: avatarOverride || undefined, // group avatars usually don't default randomly
        createdAt,
        id: chatId,
        peerId: peerUserId || null,
        messages: peerUserId ? [] : [welcomeMessage],
        name: trimmedName,
      });

      if (backendGroupId && fullGroupData) {
         nextChat.isGroupChat = true;
         nextChat.groupAdmin = String(fullGroupData.groupAdmin?._id || fullGroupData.groupAdmin || "");
         nextChat.anyoneCanAdd = fullGroupData.anyoneCanAdd ?? true;
      }

      setChats((currentChats) => {
        if (peerUserId && currentChats.some((c) => String(c.id) === peerUserId)) {
          return currentChats;
        }
        if (backendGroupId && currentChats.some((c) => String(c.id) === backendGroupId)) {
          return currentChats;
        }
        return [nextChat, ...currentChats];
      });
      setActiveChatId(chatId);
      setActiveTab("All Chats");
      setSearchTerm("");
      setNewChatName("");

      if (backendGroupId) {
         // Auto-join socket room for newly created group
         emit("join_chat", { chatId: backendGroupId });
      } else if (peerUserId) {
        emit("create_chat", {
          accent: nextChat.accent,
          avatar: nextChat.avatar,
          createdAt,
          inviterName: currentUsername,
          peerUserId,
        });

        if (token) {
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
      } else if (isObj && chatInput.isGroup && token) {
        // Real Backend Group Creation
        createGroupChatApi(token, {
          name: trimmedName,
          users: chatInput.members || [],
          accent: accentOverride,
          avatar: avatarOverride
        })
        .then(fullGroup => {
          const realGroupId = String(fullGroup._id);
          setChats(current => current.map(c => 
            String(c.id) === String(chatId) 
              ? { 
                  ...c, 
                  id: realGroupId, 
                  isGroupChat: true,
                  groupAdmin: String(fullGroup.groupAdmin?._id || fullGroup.groupAdmin || ""),
                  anyoneCanAdd: fullGroup.anyoneCanAdd ?? true,
                  groupAccent: fullGroup.groupAccent
                } 
              : c
          ));
          setActiveChatId(realGroupId);
          // Auto-join socket room for newly created group
          emit("join_chat", { chatId: realGroupId });
        })
        .catch(err => {
          console.error("[chat] Group creation failed:", err);
          alert("Failed to create group on server.");
        });
      }

      return chatId;
    },
    [createChatRecord, currentUsername, emit, newChatName, token],
  );


  const clearActiveChatMessages = useCallback(() => {
    if (!activeChat) {
      console.warn("❌ Cannot clear chat: activeChat is null");
      alert("No chat selected to clear");
      return;
    }
    
    if (!token) {
      console.warn("❌ Cannot clear chat: token is missing");
      alert("Not authenticated");
      return;
    }

    console.log("🔄 Clearing chat history for:", activeChat.id);

    // Capture messages before optimistic update for revert on error
    const previousMessages = [...(activeChat.messages || [])];

    // Optimistic UI update
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

    // Call API to persist the change
    clearChatHistory(token, activeChat.id)
      .then((response) => {
        console.log("✅ Chat history cleared successfully:", response);
      })
      .catch((error) => {
        console.error("❌ Failed to clear chat history:", error);
        // Revert optimistic update on error using captured messages
        setChats((currentChats) =>
          currentChats.map((chat) =>
            String(chat.id) === String(activeChat.id)
              ? { ...chat, messages: previousMessages }
              : chat,
          ),
        );
        alert(`Failed to clear chat history: ${error.message}`);
      });
  }, [activeChat, token]);

  const deleteActiveChat = useCallback(() => {
    if (!activeChat) {
      console.warn("❌ Cannot delete chat: activeChat is null");
      alert("No chat selected to delete");
      return;
    }
    
    if (!token) {
      console.warn("❌ Cannot delete chat: token is missing");
      alert("Not authenticated");
      return;
    }

    console.log("🔄 [chat] Deleting chat:", activeChat.id);
    console.log("🔍 [chat] Active User ID:", currentUserId);
 
    // Optimistic UI update
    setChats((currentChats) =>
      currentChats.filter((chat) => String(chat.id) !== String(activeChat.id)),
    );
     
    setActiveChatId((currentId) => {
      // Find remaining chats after the optimistic removal
      const remainingChats = chats.filter((chat) => String(chat.id) !== String(activeChat.id));
      
      // If we deleted the active chat, pick the first remaining one or null
      if (String(currentId) === String(activeChat.id)) {
        return remainingChats.length > 0 ? remainingChats[0].id : null;
      }
      return currentId;
    });

    // Call API to persist the change
    deleteChat(token, activeChat.id)
      .then((response) => {
        console.log("✅ Chat deleted successfully:", response);
      })
      .catch((error) => {
        console.error("❌ Failed to delete chat:", error);
        // Revert optimistic update on error by reloading chats
        fetchUserChats(token)
          .then((reloadedChats) => {
            setChats(
              reloadedChats.map((chat) =>
                createChatRecord({
                  id: chat._id,
                  name: chat.participants?.find((p) => String(p._id) !== String(currentUserId))?.username || "Unknown",
                  avatar: chat.participants?.find((p) => String(p._id) !== String(currentUserId))?.profilePic || "",
                  accent: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
                  createdAt: new Date(chat.createdAt).getTime(),
                })
              )
            );
          })
          .catch((reloadError) => {
            console.error("❌ Failed to reload chats after delete error:", reloadError);
          });
        // Show error to user
        alert(`Failed to delete chat: ${error.message}`);
      });
  }, [activeChat, token, chats, currentUserId, createChatRecord, fetchUserChats]);

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
      createdAt: sentAt,
      id: messageId,
      receiverId: activeChat.peerId || String(activeChat.id),
      receiverUserId: activeChat.peerId || String(activeChat.id), // Aligned with working call logic
      replyTo,
      text,
      time: new Date(sentAt).toISOString(),
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
                  time: formatTime(payload.time),
                  createdAt: sentAt, // FIX: Ensure instant rendering works
                  username: currentUsername,
                  forwarded: false,
                }),
              ],
            }
          : chat,
      ),
    );

    emit("send_message", payload, (response) => {
      if (response?.status === "ok" && response.id) {
        setChats((prev) =>
          prev.map((c) =>
            String(c.id) === String(activeChat.id)
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === payload.id ? { ...m, id: response.id } : m
                  ),
                }
              : c
          )
        );
      }
    });
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
      createdAt: sentAt,
      id: `file-${sentAt}`,
      mimeType: filePayload.mimeType,
      receiverId: activeChat.peerId || String(activeChat.id),
      receiverUserId: activeChat.peerId || String(activeChat.id), // Aligned with working call logic
      time: new Date(sentAt).toISOString(),
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
                  time: formatTime(payload.time),
                  createdAt: sentAt, // FIX: Ensure instant rendering works
                  username: currentUsername,
                  forwarded: false,
                  chatId: activeChat.id,
                }),
              ],
            }
          : chat,
      ),
    );

    emit("send_message", payload, (response) => {
      if (response?.status === "ok" && response.id) {
        setChats((prev) =>
          prev.map((c) =>
            String(c.id) === String(activeChat.id)
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === payload.id ? { ...m, id: response.id } : m
                  ),
                }
              : c
          )
        );
      }
    });
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
      // Persist to server
      if (token) {
        deleteSingleMessage(token, messageId).catch((err) => {
          console.error("[chat] Failed to persist message deletion:", err);
        });
      }
    },
    [activeChat, token],
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

      // Persist to server
      if (token) {
        deleteMessageForEveryoneApi(token, messageId, activeChat.id).catch((err) => {
          console.error("[chat] Failed to persist message deletion for everyone:", err);
        });
      }
    },
    [activeChat, emit, token],
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
        receiverId: targetChat.peerId || String(targetChat.id),
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
    activeChatId,
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
    getUserLastSeen,
    handleTypingInputChange,
    isUserOnline,
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
    isLoadingMessages,
    loadMessagesError,
    retryLoadMessages: () => activeChatId && selectChat(activeChatId),
  };
}

export default useChatController;
