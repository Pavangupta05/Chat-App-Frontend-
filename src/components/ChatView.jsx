import { useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import ChatWindow from "./ChatWindow";

function ChatView() {
  const { id } = useParams();
  const context = useOutletContext();
  const navigate = useNavigate();
  const loadTimeoutRef = useRef(null);

  // ── Debug logging ────────────────────────────────────────────────────────
  useEffect(() => {
    console.log("[ChatView] Chat ID from URL:", id);
    console.log("[ChatView] currentChat:", context.currentChat?.id ?? "null");
    console.log("[ChatView] isLoadingMessages:", context.isLoadingMessages);
    console.log("[ChatView] loadMessagesError:", context.loadMessagesError);
  });

  // ── Safety: if no id in URL, show placeholder ────────────────────────────
  if (!id) {
    return (
      <div className="chat-window chat-window--empty">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  // ── Error state: access denied or failed fetch ───────────────────────────
  if (context.loadMessagesError) {
    return (
      <div className="chat-window chat-window--error">
        <div className="chat-error-inner">
          <span className="chat-error-icon">⚠️</span>
          <p className="chat-error-title">Failed to load conversation</p>
          <p className="chat-error-body">{context.loadMessagesError}</p>
          <div className="chat-error-actions">
            <button
              className="btn-retry"
              onClick={context.retryLoadMessages}
            >
              Try Again
            </button>
            <button
              className="btn-back"
              onClick={() => navigate("/", { replace: true })}
            >
              ← Back to chats
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (!context.currentChat) {
    return (
      <div className="chat-window chat-window--loading">
        <div className="pulse-loader"></div>
        <p>Loading conversation...</p>
      </div>
    );
  }

  // ── Render chat ──────────────────────────────────────────────────────────
  return (
    <div
      className={`chat-main-area ${context.backgroundDoodle?.type ? `chat-bg-doodle-${context.backgroundDoodle.type}` : ""}`}
      style={{ "--bg-overlay-opacity": context.backgroundDoodle?.opacity ?? 0.3 }}
    >
      <ChatWindow
        backgroundDoodle={context.backgroundDoodle}
        callProps={context.call}
        chat={context.currentChat}
        draftMessage={context.draftMessage}
        isCompactInput={context.isMobileView}
        isMobileView={context.isMobileView}
        onClearReply={context.clearReply}
        onConfirmClearChat={() => context.setConfirmAction("clear-chat")}
        onConfirmDeleteChat={() => context.setConfirmAction("delete-chat")}
        onDeleteMessageForEveryone={context.deleteMessageForEveryone}
        onDeleteMessageForMe={context.deleteMessageForMe}
        onDraftChange={(val) => { context.setDraftMessage(val); context.handleTypingInputChange(val); }}
        onFileUpload={context.sendFileMessage}
        onForwardMessage={context.startForwardMessage}
        onMobileBack={context.handleMobileBack}
        onReplyMessage={context.setReplyMessage}
        onSendMessage={context.sendMessage}
        onStartAudioCall={() => context.call?.startCall("audio")}
        onStartVideoCall={() => context.call?.startCall("video")}
        replyMessage={context.replyMessage}
        typingText={context.socketState.isConnected ? context.typing.text : ""}
      />
    </div>
  );
}

export default ChatView;
