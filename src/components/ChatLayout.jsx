import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import ForwardModal from "./ForwardModal";
import NewChatModal from "./NewChatModal";
import ProfilePanel from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import Call from "./Call";
import AudioCallModal from "./AudioCallModal";
import useChatController from "../hooks/useChatController";
import { useAuth } from "../context/AuthContext";

function ChatLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    activeTab,
    call,
    chats,
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
    searchTerm,
    sendFileMessage,
    sendMessage,
    selectChat,
    setReplyMessage,
    replyMessage,
    cancelForwardMessage,
    forwardMessageToChat,
    startForwardMessage,
    setActiveTab,
    setDraftMessage,
    setSearchTerm,
    socketState,
    typing,
    username,
  } = useChatController();

  const [viewport, setViewport] = useState(() => {
    if (window.innerWidth < 768) return "mobile";
    if (window.innerWidth < 1024) return "tablet";
    return "desktop";
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Dark is default for Telegram style; stored preference overrides
  const [theme, setTheme] = useState(
    () => window.sessionStorage.getItem("chat-theme") || "dark",
  );

  const [confirmAction, setConfirmAction] = useState(null);
  const [chatModalMode, setChatModalMode] = useState(null); // null | "chat" | "group"
  const [panelMode, setPanelMode] = useState(null);        // null | "profile" | "settings"
  const { logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setViewport("mobile");
        setIsSidebarOpen(true);
        return;
      }
      if (w < 1024) {
        setViewport("tablet");
        setIsSidebarOpen(false);
        setIsMobileChatOpen(true);
        return;
      }
      setViewport("desktop");
      setIsSidebarOpen(true);
      setIsMobileChatOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ROUTE-BASED NAVIGATION: Sync URL with UI state
  // When chat, settings, or profile is selected, update the URL
  useEffect(() => {
    if (panelMode === "settings") {
      navigate("/settings", { replace: false });
    } else if (panelMode === "profile") {
      navigate("/profile", { replace: false });
    } else if (currentChat && isMobileView && isMobileChatOpen) {
      navigate(`/chat/${currentChat.id}`, { replace: false });
    } else if (!currentChat && isMobileView) {
      navigate("/", { replace: false });
    }
  }, [panelMode, currentChat, isMobileView, isMobileChatOpen, navigate]);

  // BACK BUTTON HANDLING: Listen for URL changes and sync UI state
  useEffect(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    
    // Parse current route
    if (location.pathname === "/" || pathSegments.length === 0) {
      // Root: show chat list, close panels
      setPanelMode(null);
      if (isMobileView) setIsMobileChatOpen(false);
    } else if (location.pathname === "/settings") {
      // Settings panel
      setPanelMode("settings");
    } else if (location.pathname === "/profile") {
      // Profile panel
      setPanelMode("profile");
    } else if (pathSegments[0] === "chat" && pathSegments[1]) {
      // Chat screen: /chat/:id
      const chatId = pathSegments[1];
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        selectChat(chatId);
        if (isMobileView) setIsMobileChatOpen(true);
      }
    }
  }, [location.pathname, isMobileView, chats, selectChat]);

  // SMOOTH BACK BUTTON: On mobile, back navigates within app
  useEffect(() => {
    if (!isMobileView) return;

    const handleBackButton = (e) => {
      // Browser back button was pressed (via popstate)
      // React Router handles this automatically, so we just ensure UI stays in sync
      // by the location effect above
    };

    window.addEventListener("popstate", handleBackButton);
    return () => window.removeEventListener("popstate", handleBackButton);
  }, [isMobileView]);

  // Old mobile back button handling - manage browser history
  // (Keeping for backward compatibility, but new navigation uses routes)

  // Apply theme to <html data-theme="...">  (dark = no attribute, light = "light")
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
    window.sessionStorage.setItem("chat-theme", theme);
  }, [theme]);

  // Apply color theme from sessionStorage on mount
  useEffect(() => {
    const savedColorTheme = window.sessionStorage.getItem("chat-color-theme") || "blue";
    const root = document.documentElement;
    root.classList.remove("theme-blue", "theme-purple", "theme-green", "theme-red", "theme-orange", "theme-pink");
    root.classList.add(`theme-${savedColorTheme}`);
  }, []);

  // Background doodle customization
  const [backgroundDoodle, setBackgroundDoodle] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("chat-bg-doodle")) || { type: "light", opacity: 0.3 };
    } catch {
      return { type: "light", opacity: 0.3 };
    }
  });

  const handleBackgroundChange = (type, opacity) => {
    const newBg = { type, opacity };
    setBackgroundDoodle(newBg);
    window.localStorage.setItem("chat-bg-doodle", JSON.stringify(newBg));
  };

  // Apply background doodle styles
  useEffect(() => {
    const messagesEl = document.querySelector(".chat-window__messages");
    if (messagesEl) {
      // Remove all doodle classes
      messagesEl.classList.remove("chat-bg-doodle-light", "chat-bg-doodle-dark", "chat-bg-doodle-minimal", "chat-bg-doodle-wave");
      // Add current doodle class
      if (backgroundDoodle.type) {
        messagesEl.classList.add(`chat-bg-doodle-${backgroundDoodle.type}`);
      }
      // Set opacity variable
      messagesEl.style.setProperty("--bg-overlay-opacity", backgroundDoodle.opacity || 0.3);
    }
  }, [backgroundDoodle]);

  const isMobileView = viewport === "mobile";

  const handleSelectChat = (id) => {
    selectChat(id);
    if (isMobileView) {
      setIsMobileChatOpen(true);
      navigate(`/chat/${id}`);
    }
  };

  const handleOpenSettings = () => {
    setPanelMode("settings");
    navigate("/settings");
  };

  const handleOpenProfile = () => {
    setPanelMode("profile");
    navigate("/profile");
  };

  const handleClosePanel = () => {
    setPanelMode(null);
    navigate("/");
  };

  const closeConfirmModal = () => setConfirmAction(null);

  const handleConfirmAction = () => {
    if (confirmAction === "clear-chat") clearActiveChatMessages();
    if (confirmAction === "delete-chat") deleteActiveChat();
    closeConfirmModal();
  };

  // CSS slide classes for mobile
  const isChatVisible = !!currentChat;
  const layoutClass = isMobileView
    ? isMobileChatOpen && isChatVisible
      ? "is-mobile-chat"
      : "is-mobile-sidebar"
    : "";

  // Desktop empty state when no chat is selected
  const showEmptyState = !isMobileView && !currentChat;

  return (
    <main className="app">
      <section className={`telegram-layout telegram-layout--${viewport} ${layoutClass}`}>
        <Sidebar
          activeChatId={currentChat?.id}
          activeTab={activeTab}
          chats={chats}
          connectionLabel={socketState.isConnected ? "Online" : (socketState.connectionError ?? "Connecting…")}
          isOpen={isMobileView ? true : isSidebarOpen}
          isUserOnline={isUserOnline}
          onLogout={logout}
          onNewChat={() => setChatModalMode("chat")}
          onNewGroup={() => setChatModalMode("group")}
          onProfile={handleOpenProfile}
          onSettings={handleOpenSettings}
          onThemeToggle={() =>
            setTheme((t) => (t === "dark" ? "light" : "dark"))
          }
          onSearchChange={setSearchTerm}
          onSelectChat={handleSelectChat}
          onDeleteChat={(id) => {
            selectChat(id);
            setConfirmAction("delete-chat");
          }}
          onTabChange={setActiveTab}
          onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
          searchTerm={searchTerm}
          theme={theme}
          username={username}
          viewport={viewport}
        />

        {showEmptyState ? (
          /* Desktop empty-state panel */
          <div className="chat-window">
            <div className="chat-window__empty">
              <div className="chat-window__empty-icon">
                <MessageSquare size={36} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                Select a chat
              </p>
              <p style={{ color: "var(--text-secondary)", maxWidth: 260 }}>
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        ) : (
          <ChatWindow
            callProps={{
              acceptCall: call.acceptCall,
              callDuration: call.callDuration,
              callError: call.callError,
              callMode: call.callMode,
              callStatus: call.callStatus,
              endCall: call.endCall,
              incomingCall: call.incomingCall,
              isMuted: call.isMuted,
              localStream: call.localStream,
              remoteStream: call.remoteStream,
              toggleMute: call.toggleMute,
            }}
            chat={currentChat}
            draftMessage={draftMessage}
            isCompactInput={viewport !== "desktop"}
            isMobileView={isMobileView}
            onClearReply={clearReply}
            onConfirmClearChat={() => setConfirmAction("clear-chat")}
            onConfirmDeleteChat={() => setConfirmAction("delete-chat")}
            onDeleteMessageForEveryone={deleteMessageForEveryone}
            onDeleteMessageForMe={deleteMessageForMe}
            onDraftChange={(nextValue) => {
              setDraftMessage(nextValue);
              handleTypingInputChange(nextValue);
            }}
            onFileUpload={sendFileMessage}
            onForwardMessage={startForwardMessage}
            onMobileBack={() => {
              setIsMobileChatOpen(false);
              navigate("/");
            }}
            onReplyMessage={setReplyMessage}
            onSendMessage={sendMessage}
            onStartAudioCall={() => call.startCall("audio")}
            onStartVideoCall={() => call.startCall("video")}
            replyMessage={replyMessage}
            typingText={socketState.isConnected ? typing.text : ""}
          />
        )}
      </section>

      <ForwardModal
        chats={chats}
        message={forwardingMessage}
        onClose={cancelForwardMessage}
        onForward={forwardMessageToChat}
      />
      <ConfirmModal
        actionLabel={confirmAction === "delete-chat" ? "Delete chat" : "Clear history"}
        description={
          confirmAction === "delete-chat"
            ? "Are you sure you want to delete this chat?"
            : "Are you sure you want to clear this chat history?"
        }
        isOpen={Boolean(confirmAction)}
        onCancel={closeConfirmModal}
        onConfirm={handleConfirmAction}
        title={confirmAction === "delete-chat" ? "Delete chat" : "Clear chat history"}
      />
      <NewChatModal
        isOpen={Boolean(chatModalMode)}
        mode={chatModalMode ?? "chat"}
        onClose={() => setChatModalMode(null)}
        onCreate={({ name, accent, avatar, peerUserId }) => {
          createChat({ name, accent, avatar, peerUserId });
          setChatModalMode(null);
          if (isMobileView) setIsMobileChatOpen(true);
        }}
      />
      <Call
        callMode={call.callMode}
        callError={call.callError}
        callStatus={call.callStatus}
        incomingCall={call.incomingCall}
        localStream={call.localStream}
        permissionRetryable={call.permissionRetryable}
        remoteStream={call.remoteStream}
        onAcceptCall={() => call.acceptCall()}
        onEndCall={() => call.endCall()}
        onRetryPermission={() => call.startCall(call.callMode || "video")}
      />
      <AudioCallModal
        callError={call.callError}
        callMode={call.callMode}
        audioStatus={call.callMode === "audio" ? call.callStatus : "idle"}
        callDuration={call.callDuration ?? 0}
        chatName={call.incomingCall?.username ?? currentChat?.name ?? "Unknown Caller"}
        incomingCall={call.callMode === "audio" ? call.incomingCall : null}
        isMuted={call.isMuted}
        localStream={call.localStream}
        permissionRetryable={call.permissionRetryable}
        onAcceptCall={() => call.acceptCall()}
        onEndCall={() => call.endCall()}
        onRetryPermission={() => call.startCall("audio")}
        onToggleMute={call.toggleMute}
        remoteStream={call.remoteStream}
      />
      <ProfilePanel
        isOpen={panelMode === "profile"}
        onClose={handleClosePanel}
      />
      <SettingsPanel
        isOpen={panelMode === "settings"}
        onClose={handleClosePanel}
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onLogout={logout}
        backgroundDoodle={backgroundDoodle}
        onBackgroundChange={handleBackgroundChange}
      />
    </main>
  );
}

export default ChatLayout;
