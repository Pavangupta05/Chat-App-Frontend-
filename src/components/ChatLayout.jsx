import { useEffect, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import ForwardModal from "./ForwardModal";
import NewChatModal from "./NewChatModal";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import Call from "./Call";
import AudioCallModal from "./AudioCallModal";
import useChatController from "../hooks/useChatController";
import { useAuth } from "../context/AuthContext";
import { AnimatePresence } from "framer-motion";

function ChatLayout() {
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
    if (window.innerWidth < 768) {
      return "mobile";
    }

    if (window.innerWidth < 1024) {
      return "tablet";
    }

    return "desktop";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(() => window.innerWidth >= 768);
  const [theme, setTheme] = useState(
    () => window.sessionStorage.getItem("chat-theme") || "light",
  );
  const [confirmAction, setConfirmAction] = useState(null);
  // null | "chat" | "group"
  const [chatModalMode, setChatModalMode] = useState(null);
  const { logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewport("mobile");
        setIsSidebarOpen(false);
        setIsMobileChatOpen(false); // always show chat list first on mobile
        return;
      }

      if (window.innerWidth < 1024) {
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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.sessionStorage.setItem("chat-theme", theme);
  }, [theme]);

  const isMobileView = viewport === "mobile";

  const handleSelectChat = (id) => {
    selectChat(id);
    if (viewport === "mobile") {
      setIsMobileChatOpen(true);
    }
  };
  const closeConfirmModal = () => setConfirmAction(null);

  const handleConfirmAction = () => {
    if (confirmAction === "clear-chat") {
      clearActiveChatMessages();
    }

    if (confirmAction === "delete-chat") {
      deleteActiveChat();
    }

    closeConfirmModal();
  };

  const showSidebar = viewport !== "mobile" || !isMobileChatOpen;
  const showChatWindow = viewport !== "mobile" || (isMobileChatOpen && !!currentChat);

  return (
    <main className="app">
      <section className={`telegram-layout telegram-layout--${viewport}`}>
        {showSidebar && (
          <Sidebar
            activeChatId={currentChat?.id}
            activeTab={activeTab}
            chats={chats}
            connectionLabel={socketState.isConnected ? "Online now" : socketState.connectionError}
            isOpen={isSidebarOpen}
            onLogout={logout}
            onNewChat={() => setChatModalMode("chat")}
            onNewGroup={() => setChatModalMode("group")}
            onThemeToggle={() =>
              setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"))
            }
            onSearchChange={setSearchTerm}
            onSelectChat={handleSelectChat}
            onDeleteChat={(id) => {
              selectChat(id);
              setConfirmAction("delete-chat");
            }}
            onTabChange={setActiveTab}
            onToggleSidebar={() => setIsSidebarOpen((currentValue) => !currentValue)}
            searchTerm={searchTerm}
            theme={theme}
            username={username}
          />
        )}

        {showChatWindow && (
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
            isMobileView={viewport === "mobile"}
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
            onMobileBack={() => setIsMobileChatOpen(false)}
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
          // Auto-open chat on mobile
          if (viewport === "mobile") setIsMobileChatOpen(true);
        }}
      />
      <Call
        callMode={call.callMode}
        callError={call.callError}
        callStatus={call.callStatus}
        incomingCall={call.incomingCall}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        onAcceptCall={() => call.acceptCall()}
        onEndCall={() => call.endCall()}
      />
      <AudioCallModal
        callMode={call.callMode}
        audioStatus={call.callMode === "audio" ? call.callStatus : "idle"}
        callDuration={call.callDuration ?? 0}
        chatName={call.incomingCall?.username ?? currentChat?.name ?? "Unknown Caller"}
        incomingCall={call.callMode === "audio" ? call.incomingCall : null}
        isMuted={call.isMuted}
        localStream={call.localStream}
        onAcceptCall={() => call.acceptCall("audio")}
        onEndCall={() => call.endCall()}
        onToggleMute={call.toggleMute}
        remoteStream={call.remoteStream}
      />
    </main>
  );
}

export default ChatLayout;
