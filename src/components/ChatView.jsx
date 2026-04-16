import { useEffect, useRef } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import ChatWindow from "./ChatWindow";
import ChatLanding from "./ChatLanding";
import { MessageSkeleton } from "./SkeletonLoaders";

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

  // ── Index route: show landing page ──────────────────────────────────────
  if (!id) {
    return <ChatLanding />;
  }

  // ── Error state: access denied or failed fetch ───────────────────────────
  if (context.loadMessagesError && !context.currentChat?.messages?.length && !context.currentChat?.isOptimistic) {
    return (
      <div className="chat-window chat-window--error">
        <div className="chat-error-inner">
          <div className="chat-error-icon-wrap">
            <span className="chat-error-icon">⚠️</span>
          </div>
          <p className="chat-error-title">Failed to load conversation</p>
          <p className="chat-error-body">{context.loadMessagesError}</p>
          <div className="chat-error-actions">
            <button className="btn-retry" onClick={context.retryLoadMessages}>
              Try Again
            </button>
            <button className="btn-back" onClick={() => navigate("/chat", { replace: true })}>
              ← Back to chats
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state: show skeleton shimmer ─────────────────────────────────
  if (!context.currentChat) {
    return (
      <div className="chat-window chat-window--loading">
        <div className="chat-window__header chat-window__header--skeleton">
          <div className="skeleton-header-avatar" />
          <div className="skeleton-header-body">
            <div className="skeleton-line skeleton-line--name" style={{ width: 120 }} />
            <div className="skeleton-line skeleton-line--preview" style={{ width: 80 }} />
          </div>
        </div>
        <MessageSkeleton />
      </div>
    );
  }

  // ── Render chat ──────────────────────────────────────────────────────────
  return (
    <div
      className="chat-main-area"
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
        onCameraClick={context.onCameraClick}
        replyMessage={context.replyMessage}
        theme={context.theme}
        typingText={context.socketState.isConnected ? context.typing.text : ""}
      />
    </div>
  );
}

export default ChatView;
