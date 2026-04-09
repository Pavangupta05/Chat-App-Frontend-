import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Users, Settings, User, Camera, ArrowLeft, UserPlus, Plus } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import ForwardModal from "./ForwardModal";
import NewChatModal from "./NewChatModal";
import ProfilePanel from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import VideoCallModal from "./VideoCallModal";
import AudioCallModal from "./AudioCallModal";
import NavigationStack from "./NavigationStack";
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
  const [activeScreen, setActiveScreen] = useState("chatList"); // "chatList" | "chat" | "settings" | "profile"
  const isMobileView = viewport === "mobile";

  const [theme, setTheme] = useState(
    () => window.sessionStorage.getItem("chat-theme") || "dark",
  );

  const [confirmAction, setConfirmAction] = useState(null);
  const [chatModalMode, setChatModalMode] = useState(null); // null | "chat" | "group"
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

  // SYNC URL WITH UI STATE (ONLY WHEN USER ACTS)
  const syncUrl = useCallback((mode, chatId) => {
    if (mode === "settings") navigate("/settings");
    else if (mode === "profile") navigate("/profile");
    else if (chatId) navigate(`/chat/${chatId}`);
    else navigate("/");
  }, [navigate]);

  // LISTEN FOR URL CHANGES AND SYNC TO activeScreen
  useEffect(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    
    if (pathSegments.length === 0) {
      setActiveScreen("chatList");
    } else if (pathSegments[0] === "settings") {
      setActiveScreen("settings");
    } else if (pathSegments[0] === "profile") {
      setActiveScreen("profile");
    } else if (pathSegments[0] === "chat" && pathSegments[1]) {
      const chatId = pathSegments[1];
      setActiveScreen("chat");
      if (currentChat?.id !== chatId) {
        selectChat(chatId);
      }
    }
  }, [location.pathname, selectChat, currentChat?.id]);

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

  // Scoping doodle logic is now handled in ChatWindow via props

  const handleSelectChat = (id) => {
    selectChat(id);
    navigate(`/chat/${id}`);
    setActiveScreen("chat");
  };

  const handleOpenSettings = () => {
    navigate("/settings");
    setActiveScreen("settings");
  };

  const handleOpenProfile = () => {
    navigate("/profile");
    setActiveScreen("profile");
  };

  const handleClosePanel = () => {
    navigate("/");
    setActiveScreen("chatList");
  };

  const handleMobileBack = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // 1. Move to chatList state
    setActiveScreen("chatList");
    setChatModalMode(null);

    // 2. Clear state
    selectChat(null);

    // 3. Navigate back safely
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [navigate, selectChat, location.pathname]);

  const closeConfirmModal = () => setConfirmAction(null);

  const handleConfirmAction = () => {
    if (confirmAction === "clear-chat") clearActiveChatMessages();
    if (confirmAction === "delete-chat") deleteActiveChat();
    closeConfirmModal();
  };

  const isChatVisible = !!currentChat;
  
  const layoutClass = isMobileView
    ? (activeScreen === "chat" && isChatVisible)
      ? "is-mobile-chat"
      : (activeScreen === "settings")
        ? "is-mobile-settings chat-layout--mobile"
        : (activeScreen === "profile")
          ? "is-mobile-profile chat-layout--mobile"
          : "is-mobile-sidebar chat-layout--mobile"
    : "";

  const isMobileMainScreen = activeScreen === "chatList";
  const isMobileDetailScreen = activeScreen !== "chatList";

  const showEmptyState = !isMobileView && !currentChat;

  // Calculate unread total
  const totalUnreadCount = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

  // -- Swipe Back Gesture Implementation -------------------------
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStart = useRef(0);

  const handleTouchStart = (e) => {
    if (!isMobileView || activeScreen !== "chat" || isAnimating) return;
    const x = e.touches[0].clientX;
    if (x < 60) { // Edge swipe only
      touchStart.current = x;
      setIsSwiping(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const deltaX = Math.max(0, currentX - touchStart.current);
    setSwipeX(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    
    const threshold = 100;
    if (swipeX > threshold) {
      setIsAnimating(true);
      setSwipeX(window.innerWidth);
      setTimeout(() => {
        handleMobileBack();
        setSwipeX(0);
        setIsSwiping(false);
        setIsAnimating(false);
      }, 300);
    } else {
      setIsAnimating(true);
      setSwipeX(0);
      setTimeout(() => {
        setIsSwiping(false);
        setIsAnimating(false);
      }, 250);
    }
  };

  const getStackTransform = () => {
    const slideAmount = isMobileDetailScreen ? -50 : 0;
    if (isSwiping) {
      // Swipe back: starts at -50% and goes towards 0%
      const swipePercent = (swipeX / window.innerWidth) * 50;
      return `translateX(${slideAmount + swipePercent}%)`;
    }
    return `translateX(${slideAmount}%)`;
  };

  return (
    <main 
      className={`app-container ${isMobileView ? 'is-mobile' : ''} ${isSwiping ? 'is-swiping' : ''} ${isAnimating ? 'is-animating' : ''} ${layoutClass}`}
    >
      <div 
        className="app-content-stack"
        style={{ transform: isMobileView ? getStackTransform() : 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      {/* SCREEN 1: LIST / HOME */}
      <section className="app-screen app-screen--list">
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
              {activeScreen === 'settings' && (
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
        {activeScreen === "chat" ? (
          <div className={`chat-main-area ${backgroundDoodle?.type ? `chat-bg-doodle-${backgroundDoodle.type}` : ""}`}
               style={{ "--bg-overlay-opacity": backgroundDoodle?.opacity ?? 0.3 }}>
            {!currentChat ? (
              activeChatId ? (
                <div className="chat-window chat-window--loading">
                  <div className="pulse-loader"></div>
                  <p>Loading conversation...</p>
                </div>
              ) : (
                <div className="chat-window chat-window--empty">
                  <MessageSquare size={48} />
                  <p>Select a chat to start messaging</p>
                </div>
              )
            ) : (
              <ChatWindow
                backgroundDoodle={backgroundDoodle}
                callProps={{...call}}
                chat={currentChat}
                draftMessage={draftMessage}
                isCompactInput={isMobileView}
                isMobileView={isMobileView}
                onClearReply={clearReply}
                onConfirmClearChat={() => setConfirmAction("clear-chat")}
                onConfirmDeleteChat={() => setConfirmAction("delete-chat")}
                onDeleteMessageForEveryone={deleteMessageForEveryone}
                onDeleteMessageForMe={deleteMessageForMe}
                onDraftChange={(val) => { setDraftMessage(val); handleTypingInputChange(val); }}
                onFileUpload={sendFileMessage}
                onForwardMessage={startForwardMessage}
                onMobileBack={handleMobileBack}
                onReplyMessage={setReplyMessage}
                onSendMessage={sendMessage}
                onStartAudioCall={() => call.startCall("audio")}
                onStartVideoCall={() => call.startCall("video")}
                replyMessage={replyMessage}
                typingText={socketState.isConnected ? typing.text : ""}
              />
            )}
          </div>
        ) : activeScreen === "settings" ? (
          <div className="detail-screen-placeholder">Settings Screen (In Development)</div>
        ) : activeScreen === "profile" ? (
          <div className="detail-screen-placeholder">Profile Screen (In Development)</div>
        ) : null}
      </div>
      </div>

      {/* FABs - Only visible on mobile list view to prevent desktop clashing */}
      {isMobileView && activeScreen === "chatList" && (
        <div className="fab-group">
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={cameraInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setChatModalMode("chat");
              }
            }}
          />
          <button 
            className="fab-item fab-item--camera" 
            aria-label="Camera"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera size={26} />
          </button>
          
          <button 
            className="fab-item fab-item--plus" 
            aria-label="New Chat"
            onClick={() => setChatModalMode("chat")}
          >
            <Plus size={28} />
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
          createChat({ name, accent, avatar, peerUserId });
          setChatModalMode(null);
          if (isMobileView) setActiveScreen("chat");
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
      <NavigationStack 
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
