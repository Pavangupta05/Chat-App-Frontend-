import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Users, Settings, User, Camera, ArrowLeft, UserPlus } from "lucide-react";
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
        setActiveScreen("chat");
        return;
      }
      setViewport("desktop");
      setIsSidebarOpen(true);
      setActiveScreen("chat");
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
    
    if (location.pathname === "/" || pathSegments.length === 0) {
      setActiveScreen("chatList");
    } else if (location.pathname === "/settings") {
      setActiveScreen("settings");
    } else if (location.pathname === "/profile") {
      setActiveScreen("profile");
    } else if (pathSegments[0] === "chat" && pathSegments[1]) {
      const chatId = pathSegments[1];
      setActiveScreen("chat");
      
      if (currentChat?.id !== chatId) {
        const chat = chats.find((c) => c.id === chatId);
        if (chat) selectChat(chatId);
      }
    }
  }, [location.pathname, chats, selectChat, currentChat?.id]);

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
      : "is-mobile-sidebar"
    : "";

  const isMobileChatOpen = activeScreen === "chat";

  const showEmptyState = !isMobileView && !currentChat;

  // Calculate unread total
  const totalUnreadCount = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

  // -- Swipe Back Gesture Implementation -------------------------
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStart = useRef(0);
  const isAnimating = useRef(false);

  const handleTouchStart = (e) => {
    if (!isMobileView || activeScreen !== "chat" || isAnimating.current) return;
    const x = e.touches[0].clientX;
    if (x < 60) { // Slight buffer from edge
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
    
    const threshold = 100; // Increased threshold for stability
    if (swipeX > threshold) {
      // Complete back gesture
      isAnimating.current = true;
      setSwipeX(window.innerWidth);
      
      // Delay to allow animation to complete
      setTimeout(() => {
        handleMobileBack();
        setSwipeX(0); // Reset for next time
        setIsSwiping(false);
        isAnimating.current = false;
      }, 350);
    } else {
      // Snap back
      isAnimating.current = true;
      setSwipeX(0);
      setTimeout(() => {
        setIsSwiping(false);
        isAnimating.current = false;
      }, 300);
    }
  };

  return (
    <main 
      className={`app ${isMobileView ? 'chat-layout--mobile' : ''} ${isSwiping ? 'is-swiping' : ''} ${layoutClass}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isMobileView ? (
        /* 📱 MOBILE VIEWPORT (Strip Layout) */
        <div 
          className="mobile-viewport"
          style={{
            transform: (activeScreen === "chat")
              ? `translate3d(calc(-100vw + ${swipeX}px), 0, 0)` 
              : 'translate3d(0, 0, 0)',
            transition: isSwiping ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
            height: '100%',
            width: '200vw',
            display: 'flex',
            position: 'relative'
          }}
        >
          {/* SCREEN 1: MAIN (Sidebar + Bottom Nav) */}
          <div className="mobile-screen-main">
            <section className={`telegram-layout telegram-layout--${viewport} ${layoutClass}`}>
              <Sidebar
                activeChatId={currentChat?.id}
                activeTab={activeTab}
                chats={chats}
                connectionLabel={socketState.isConnected ? "Online" : (socketState.connectionError ?? "Connecting…")}
                isOpen={true}
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
            </section>

            <nav className="mobile-nav">
              <button 
                className={`mobile-nav__item ${activeTab === 'All Chats' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('All Chats')}
              >
                {activeTab === 'All Chats' && (
                  <motion.div 
                    layoutId="activeTabPill"
                    className="mobile-nav__highlight"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="mobile-nav__pill"></div>
                <MessageSquare size={24} />
                <span style={{ fontSize: '10px' }}>Chats</span>
                {totalUnreadCount > 0 && <span className="mobile-nav__badge">{totalUnreadCount}</span>}
              </button>
              <button 
                className={`mobile-nav__item ${activeTab === 'Contacts' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('Contacts')}
              >
                {activeTab === 'Contacts' && (
                  <motion.div 
                    layoutId="activeTabPill"
                    className="mobile-nav__highlight"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="mobile-nav__pill"></div>
                <Users size={24} />
                <span style={{ fontSize: '10px' }}>Contacts</span>
              </button>
              <button 
                className={`mobile-nav__item ${activeScreen === 'settings' ? 'is-active' : ''}`}
                onClick={handleOpenSettings}
              >
                {activeScreen === 'settings' && (
                  <motion.div 
                    layoutId="activeTabPill"
                    className="mobile-nav__highlight"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="mobile-nav__pill"></div>
                <Settings size={24} />
                <span style={{ fontSize: '10px' }}>Settings</span>
              </button>
              <button 
                className={`mobile-nav__item ${activeScreen === 'profile' ? 'is-active' : ''}`}
                onClick={handleOpenProfile}
              >
                {activeScreen === 'profile' && (
                  <motion.div 
                    layoutId="activeTabPill"
                    className="mobile-nav__highlight"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="mobile-nav__pill"></div>
                <User size={24} />
                <span style={{ fontSize: '10px' }}>Profile</span>
              </button>
            </nav>
          </div>

          {/* SCREEN 2: CHAT */}
          <div className="mobile-screen-chat">
            <div className={`chat-main-area ${backgroundDoodle?.type ? `chat-bg-doodle-${backgroundDoodle.type}` : ""}`}
                 style={{ 
                   "--bg-overlay-opacity": backgroundDoodle?.opacity ?? 0.3,
                   width: '100%',
                   height: '100dvh' 
                 }}>
              {!currentChat ? (
                <div className="chat-window" style={{ background: "transparent" }}>
                  <div className="chat-window__empty">
                    <div className="chat-window__empty-icon">
                      <MessageSquare size={36} />
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                      Select a chat
                    </p>
                  </div>
                </div>
              ) : (
                <ChatWindow
                  backgroundDoodle={backgroundDoodle}
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
                  isCompactInput={true}
                  isMobileView={true}
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
          </div>
        </div>
      ) : (
        /* 💻 DESKTOP LAYOUT (Classic Sidebar + Chat) */
        <section className={`telegram-layout telegram-layout--${viewport} ${layoutClass}`}>
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

          <div className={`chat-main-area ${backgroundDoodle?.type ? `chat-bg-doodle-${backgroundDoodle.type}` : ""}`}
               style={{ "--bg-overlay-opacity": backgroundDoodle?.opacity ?? 0.3 }}>
            {showEmptyState ? (
              <div className="chat-window" style={{ background: "transparent" }}>
                <div className="chat-window__empty">
                  <div className="chat-window__empty-icon">
                    <MessageSquare size={36} />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                    Select a chat to start messaging
                  </p>
                </div>
              </div>
            ) : (
              <ChatWindow
                backgroundDoodle={backgroundDoodle}
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
                isMobileView={false}
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
        </section>
      )}

      {/* FABs - Outside moving viewport but only visible on Home */}
      {!isMobileChatOpen && (
        <>
          <input
            type="file"
            ref={cameraInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                console.log("Camera file selected:", file);
                setChatModalMode("chat");
              }
            }}
          />
          <button 
            className="camera-fab" 
            aria-label="Camera"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera size={26} />
          </button>
        </>
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
