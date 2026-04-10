import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation, Outlet, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Users, Settings, User, Camera, ArrowLeft, UserPlus, Plus, X } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import ForwardModal from "./ForwardModal";
import NewChatModal from "./NewChatModal";
import ProfilePanel from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import VideoCallModal from "./VideoCallModal";
import AudioCallModal from "./AudioCallModal";
import useChatController from "../hooks/useChatController";
import { useAuth } from "../context/AuthContext";


function ChatLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    activeChatId,
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
    drawerOpen,
    draftMessage,
    forwardingMessage,
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
    isLoadingMessages,
    loadMessagesError,
    retryLoadMessages,
  } = useChatController();


  const [viewport, setViewport] = useState(() => {
    if (window.innerWidth < 768) return "mobile";
    if (window.innerWidth < 1024) return "tablet";
    return "desktop";
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const isMobileView = viewport === "mobile";
  
  // DRIVER: Derive activeScreen from URL
  const activeScreen = location.pathname === "/" ? "chatList"
                     : location.pathname.startsWith("/chat") ? "chat"
                     : location.pathname.startsWith("/settings") ? "settings"
                     : location.pathname.startsWith("/profile") ? "profile"
                     : "chatList";


  const [theme, setTheme] = useState(
    () => window.sessionStorage.getItem("chat-theme") || "dark",
  );

  const [confirmAction, setConfirmAction] = useState(null);
  const [chatModalMode, setChatModalMode] = useState(null); // null | "chat" | "group"
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const { logout } = useAuth();
  
  const cameraInputRef = useRef(null);



  // Handle Viewport Changes
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const nextViewport = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
      setViewport(nextViewport);
      
      if (nextViewport !== "mobile") {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── AUTO-SYNC INTERNAL STATE (Chat ID) WITH URL ──────────────────────────
  // RULE: URL is the single source of truth. We only sync FROM the URL INTO state.
  // We never reset state because the URL is "/" — that could fire during animations
  // or back-swipes on mobile and wipe out the selected chat mid-navigation.
  useEffect(() => {
    console.log("[ChatLayout] Route:", location.pathname);

    if (location.pathname.startsWith("/chat/")) {
      const urlChatId = location.pathname.split("/chat/")[1];
      console.log("[ChatLayout] Chat ID from URL:", urlChatId);

      // Only call selectChat when the ID actually changes to avoid redundant fetches
      if (urlChatId && String(activeChatId) !== String(urlChatId)) {
        selectChat(urlChatId);
      }
    }
    // ✅ DO NOT call selectChat(null) when pathname === "/".
    // Deselection happens only via explicit user actions (back button, handleMobileBack).
  }, [location.pathname, selectChat, activeChatId]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
    window.localStorage.setItem("chat-theme", theme);
  }, [theme]);

  useEffect(() => {
    const savedColorTheme = window.localStorage.getItem("chat-color-theme") || "blue";
    const root = document.documentElement;
    root.classList.remove(
      "theme-blue", "theme-purple", "theme-green", "theme-red", "theme-orange", "theme-pink",
      "theme-teal", "theme-rose", "theme-cyan", "theme-indigo", "theme-yellow", "theme-amber"
    );
    root.classList.add(`theme-${savedColorTheme}`);
  }, []);

  const [backgroundDoodle, setBackgroundDoodle] = useState(() => {
    try {
      const saved = window.localStorage.getItem("chat-bg-doodle");
      return saved ? JSON.parse(saved) : { type: "light", opacity: 0.3 };
    } catch {
      return { type: "light", opacity: 0.3 };
    }
  });

  const handleBackgroundChange = (type, opacity, customUrl = null) => {
    // If we're setting a standard doodle, we keep the previous customUrl just in case the user switches back.
    // If we're setting 'custom', we MUST have a customUrl.
    const newBg = { 
      type, 
      opacity: opacity !== undefined ? opacity : backgroundDoodle.opacity, 
      customUrl: type === 'custom' ? (customUrl || backgroundDoodle.customUrl) : (backgroundDoodle.customUrl || null)
    };
    setBackgroundDoodle(newBg);
    window.localStorage.setItem("chat-bg-doodle", JSON.stringify(newBg));
  };

  // Scoping doodle logic is now handled in ChatWindow via props

  const handleSelectChat = (id) => {
    navigate(`/chat/${id}`);
  };

  const handleOpenSettings = () => {
    navigate("/settings");
  };

  const handleOpenProfile = () => {
    navigate("/profile");
  };

  const handleClosePanel = () => {
    navigate("/");
  };


  const handleMobileBack = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    navigate("/", { replace: true });
  }, [navigate]);

  const closeConfirmModal = () => setConfirmAction(null);

  const handleConfirmAction = () => {
    if (confirmAction === "clear-chat") clearActiveChatMessages();
    if (confirmAction === "delete-chat") deleteActiveChat();
    closeConfirmModal();
  };

  const isChatVisible = activeScreen === "chat" || !!currentChat;
  
  const layoutClass = isMobileView
    ? (activeScreen === "chat" && isChatVisible)
      ? "is-mobile-chat"
      : (activeScreen === "settings")
        ? "is-mobile-settings chat-layout--mobile"
        : (activeScreen === "profile")
          ? "is-mobile-profile chat-layout--mobile"
          : "is-mobile-sidebar chat-layout--mobile"
    : "";

  const isMobileMainScreen = activeScreen === "chatList" || activeScreen === "contacts";
  const isMobileDetailScreen = activeScreen === "chat" || activeScreen === "settings" || activeScreen === "profile";

  const showEmptyState = !isMobileView && !currentChat;

  // Calculate unread total
  const totalUnreadCount = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);


  return (
    <main 
      className={`app-container ${isMobileView ? 'is-mobile' : ''} ${layoutClass}`}
    >
      <div className="app-content-stack">
      {/* SCREEN 1: LIST / HOME */}
      <section className="app-screen app-screen--list">
        <AnimatePresence>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--sidebar-surface)' /* Solid background to prevent ghosting */
            }}
          >
            <Sidebar
              activeChatId={currentChat?.id}
              activeTab={activeTab}
              chats={chats}
              connectionLabel={socketState.isConnected ? "Online" : (socketState.connectionError ?? "Connecting…")}
              isOpen={isSidebarOpen}
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
          </motion.div>
        </AnimatePresence>

        {isMobileView && (
          <nav className="mobile-nav">
            <button 
              className={`mobile-nav__item ${activeTab === 'All Chats' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('All Chats')}
            >
              {activeTab === 'All Chats' && (
                <motion.div layoutId="activeTabPill" className="mobile-nav__highlight" />
              )}
              <MessageSquare size={24} />
              <span>Chats</span>
              {totalUnreadCount > 0 && <span className="mobile-nav__badge">{totalUnreadCount}</span>}
            </button>
            <button 
              className={`mobile-nav__item ${activeTab === 'Contacts' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('Contacts')}
            >
              {activeTab === 'Contacts' && (
                <motion.div layoutId="activeTabPill" className="mobile-nav__highlight" />
              )}
              <Users size={24} />
              <span>Contacts</span>
            </button>
            <button 
              className={`mobile-nav__item ${activeScreen === 'profile' ? 'is-active' : ''}`}
              onClick={handleOpenProfile}
            >
              {activeScreen === 'profile' && (
                <motion.div layoutId="activeTabPill" className="mobile-nav__highlight" />
              )}
              <User size={24} />
              <span>Profile</span>
            </button>
            <button 
              className={`mobile-nav__item ${activeScreen === 'settings' ? 'is-active' : ''}`}
              onClick={handleOpenSettings}
            >
              {location.pathname === '/settings' && (
                <motion.div layoutId="activeTabPill" className="mobile-nav__highlight" />
              )}
              <Settings size={24} />
              <span>Settings</span>
            </button>
          </nav>
        )}
      </section>

      {/* SCREEN 2: DETAIL (Chat / Settings / Profile) */}
      <div className="app-screen app-screen--detail">
        <AnimatePresence>
          <motion.div
            key={location.pathname.split('/')[1] || 'empty'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              zIndex: 1
            }}
          >
            <Outlet context={{
              activeChatId,
              backgroundDoodle,
              call,
              currentChat,
              draftMessage,
              isMobileView,
              clearReply,
              setConfirmAction,
              deleteMessageForEveryone,
              deleteMessageForMe,
              setDraftMessage,
              handleTypingInputChange,
              sendFileMessage,
              startForwardMessage,
              handleMobileBack,
              setReplyMessage,
              sendMessage,
              replyMessage,
              socketState,
              typing,
              isLoadingMessages,
              loadMessagesError,
              retryLoadMessages,
              theme,
              onThemeToggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
              onLogout: logout,
              onBackgroundChange: handleBackgroundChange,
              onClosePanel: handleClosePanel,
            }} />
          </motion.div>
        </AnimatePresence>
      </div>
      </div>

      {/* 🟢 Mobile UI FAB Toggle System */}
      {isMobileView && !currentChat && (
        <div className={`fab-group ${isFabExpanded ? "is-expanded" : ""}`}>
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={cameraInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setChatModalMode("chat");
                setIsFabExpanded(false);
              }
            }}
          />
          
          <AnimatePresence>
            {isFabExpanded && (
              <>
                <motion.button 
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  className="fab-item fab-item--sub fab-item--camera" 
                  aria-label="Camera"
                  onClick={() => { cameraInputRef.current?.click(); setIsFabExpanded(false); }}
                >
                  <Camera size={22} />
                  <span className="fab-label">Camera</span>
                </motion.button>

                <motion.button 
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: 0.05 }}
                  className="fab-item fab-item--sub fab-item--add-group" 
                  aria-label="New Group"
                  onClick={() => { setChatModalMode("group"); setIsFabExpanded(false); }}
                >
                  <Users size={22} />
                  <span className="fab-label">New Group</span>
                </motion.button>

                <motion.button 
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: 0.1 }}
                  className="fab-item fab-item--sub fab-item--add-user" 
                  aria-label="New Chat"
                  onClick={() => { setChatModalMode("chat"); setIsFabExpanded(false); }}
                >
                  <UserPlus size={22} />
                  <span className="fab-label">New Chat</span>
                </motion.button>
              </>
            )}
          </AnimatePresence>

          <button 
            className={`fab-item fab-item--main ${isFabExpanded ? "is-active" : ""}`}
            aria-label="Toggle Actions"
            onClick={() => setIsFabExpanded(!isFabExpanded)}
          >
            {isFabExpanded ? <X size={28} /> : <Plus size={28} />}
          </button>
        </div>
      )}

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
          const newId = createChat({ name, accent, avatar, peerUserId });
          setChatModalMode(null);
          if (newId) {
            navigate(`/chat/${newId}`);
          }
        }}
      />
      <VideoCallModal
        callMode={call.callMode}
        callError={call.callError}
        callStatus={call.callStatus}
        callDuration={call.callDuration}
        chatName={call.incomingCall?.username ?? currentChat?.name ?? "Unknown Caller"}
        incomingCall={call.callMode === "video" ? call.incomingCall : null}
        isMuted={call.isMuted}
        isCameraOff={call.isCameraOff}
        localStream={call.localStream}
        permissionRetryable={call.permissionRetryable}
        remoteStream={call.remoteStream}
        secureContext={call.secureContext}
        onAcceptCall={() => call.acceptCall()}
        onEndCall={() => call.endCall()}
        onRetryPermission={() => call.startCall("video")}
        onToggleMute={call.toggleMute}
        onToggleCamera={call.toggleCamera}
        onFlipCamera={call.flipCamera}
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
        secureContext={call.secureContext}
      />
      {/* MODALS & PANELS managed by React Router child routes or specific modals above */}

    </main>
  );
}

export default ChatLayout;
