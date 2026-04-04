import { useEffect, useMemo, useRef, useState } from "react";
import AudioCallModal from "./AudioCallModal";
import Call from "./Call";
import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import TypingIndicator from "./TypingIndicator";

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M10.5 4.75a5.75 5.75 0 1 0 0 11.5a5.75 5.75 0 0 0 0-11.5Zm0-1.5a7.25 7.25 0 1 1 0 14.5a7.25 7.25 0 0 1 0-14.5Zm9.03 14.97l-3.16-3.16l1.06-1.06l3.16 3.16l-1.06 1.06Z"
      fill="currentColor"
    />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5 7.25h14v1.5H5v-1.5Zm0 8h14v1.5H5v-1.5Zm0-4h14v1.5H5v-1.5Z"
      fill="currentColor"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M6.57 4.85a1.75 1.75 0 0 1 1.88-.42l2.18.87a1.75 1.75 0 0 1 1.02 1.96l-.33 1.66a1.75 1.75 0 0 1-1.24 1.33l-.75.22a13.95 13.95 0 0 0 4.2 4.2l.22-.75a1.75 1.75 0 0 1 1.33-1.24l1.66-.33a1.75 1.75 0 0 1 1.96 1.02l.87 2.18a1.75 1.75 0 0 1-.42 1.88l-1 1a2.75 2.75 0 0 1-2.54.75c-3.82-.89-7.34-4.41-8.23-8.23a2.75 2.75 0 0 1 .75-2.54l1-1Z"
      fill="currentColor"
    />
  </svg>
);

const VideoIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4.75 6.75A2.75 2.75 0 0 1 7.5 4h7A2.75 2.75 0 0 1 17.25 6.75v1.7l2.5-1.88c1.1-.82 2.25-.04 2.25 1.33v8.2c0 1.37-1.15 2.15-2.25 1.33l-2.5-1.88v1.7A2.75 2.75 0 0 1 14.5 20h-7a2.75 2.75 0 0 1-2.75-2.75v-10.5Z"
      fill="currentColor"
    />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="m10.71 6.29-5 5a1 1 0 0 0 0 1.42l5 5 1.41-1.42L8.83 13H19v-2H8.83l3.29-3.29-1.41-1.42Z"
      fill="currentColor"
    />
  </svg>
);

function ChatWindow({
  callProps,
  chat,
  onConfirmClearChat,
  onConfirmDeleteChat,
  onDeleteMessageForEveryone,
  onDeleteMessageForMe,
  draftMessage,
  isCompactInput,
  isMobileView,
  onDraftChange,
  onFileUpload,
  onForwardMessage,
  onMobileBack,
  onReplyMessage,
  onSendMessage,
  onStartAudioCall,
  onStartVideoCall,
  replyMessage,
  onClearReply,
  typingText,
}) {
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [previewMessage, setPreviewMessage] = useState(null);

  const isPreviewVideo = useMemo(
    () =>
      Boolean(
        previewMessage?.file &&
          (previewMessage.mimeType?.startsWith("video/") ||
            /\.(mp4|webm|ogg|mov)$/i.test(previewMessage.file))
      ),
    [previewMessage]
  );

  const visibleMessages = useMemo(() => {
    const normalizedTerm = messageSearch.trim().toLowerCase();

    if (!normalizedTerm) {
      return chat?.messages ?? [];
    }

    return (chat?.messages ?? []).filter((message) => {
      const searchableText = [
        message.text,
        message.fileName,
        message.username,
        message.deleted ? "This message was deleted" : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedTerm);
    });
  }, [chat?.messages, messageSearch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleMessages, typingText, callProps?.callStatus]);

  useEffect(() => {
    if (!previewMessage) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setPreviewMessage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewMessage]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  if (!chat) {
    return null;
  }

  return (
    <section className="chat-window">
      <header className="chat-window__header">
        <div className="chat-window__identity">
          {isMobileView ? (
            <button className="chat-window__back" type="button" onClick={onMobileBack}>
              <BackIcon />
            </button>
          ) : null}

          <div
            className="chat-window__avatar"
            style={{ "--avatar-accent": chat.accent }}
            aria-hidden="true"
          >
            {chat.avatar}
          </div>

          <div>
            <h2>{chat.name}</h2>
            <p className={chat.status === "online" || chat.isTyping ? "is-online" : ""}>
              {chat.isTyping ? `${chat.name.split(" ")[0]} is typing...` : chat.lastSeen}
            </p>
          </div>
        </div>

        <div className="chat-window__actions">
          <button
            className="icon-button icon-button--call"
            type="button"
            aria-label="Start audio call"
            disabled={callProps?.callStatus === "calling" || callProps?.callStatus === "in-call"}
            onClick={onStartAudioCall}
          >
            <PhoneIcon />
          </button>
          <button
            className="icon-button icon-button--call"
            type="button"
            aria-label="Start video call"
            disabled={callProps?.callStatus === "calling" || callProps?.callStatus === "in-call"}
            onClick={onStartVideoCall}
          >
            <VideoIcon />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Search in conversation"
            onClick={() => {
              setIsSearchOpen((currentValue) => !currentValue);
              setIsMenuOpen(false);
              if (isSearchOpen) {
                setMessageSearch("");
              }
            }}
          >
            <SearchIcon />
          </button>
          <div className="chat-window__menu-shell" ref={menuRef}>
            <button
              className="icon-button chat-window__menu-trigger"
              type="button"
              aria-label="Conversation menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            >
              <MenuIcon />
            </button>

            {isMenuOpen ? (
              <div className="chat-window__menu">
                <button
                  type="button"
                  onClick={() => {
                    onConfirmClearChat?.();
                    setIsMenuOpen(false);
                  }}
                >
                  Clear Chat History
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirmDeleteChat?.();
                    setIsMenuOpen(false);
                  }}
                >
                  Delete Chat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setMessageSearch("");
                    setIsMenuOpen(false);
                  }}
                >
                  Close Menu
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="chat-window__messages">
        {isSearchOpen ? (
          <div className="chat-window__search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search in this chat"
              value={messageSearch}
              onChange={(event) => setMessageSearch(event.target.value)}
            />
            <span>{visibleMessages.length}</span>
          </div>
        ) : null}

        <Call {...callProps} />
        <AudioCallModal
          callMode={callProps?.callMode}
          audioStatus={callProps?.callMode === "audio" ? callProps.callStatus : "idle"}
          callDuration={callProps?.callDuration ?? 0}
          chatName={chat.name}
          incomingCall={callProps?.callMode === "audio" ? callProps.incomingCall : null}
          isMuted={callProps?.isMuted}
          localStream={callProps?.localStream}
          onAcceptCall={callProps?.acceptCall}
          onEndCall={callProps?.endCall}
          onToggleMute={callProps?.toggleMute}
          remoteStream={callProps?.remoteStream}
        />

        {visibleMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onDeleteForEveryone={onDeleteMessageForEveryone}
            onDeleteForMe={onDeleteMessageForMe}
            onForward={onForwardMessage}
            onPreview={setPreviewMessage}
            onReply={onReplyMessage}
          />
        ))}

        <TypingIndicator text={typingText} />

        {isSearchOpen && !visibleMessages.length ? (
          <div className="chat-window__empty-search">No messages matched your search.</div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      <footer className="chat-window__footer">
        <InputBox
          disabled={callProps?.callStatus === "calling"}
          isCompact={isCompactInput}
          value={draftMessage}
          onChange={onDraftChange}
          onClearReply={onClearReply}
          onFileUpload={onFileUpload}
          onSend={onSendMessage}
          replyMessage={replyMessage}
        />
      </footer>

      {previewMessage ? (
        <div
          className="media-preview"
          role="dialog"
          aria-modal="true"
          aria-label={previewMessage.fileName || "Media preview"}
        >
          <div className="media-preview__header">
            <button
              className="media-preview__back"
              type="button"
              onClick={() => setPreviewMessage(null)}
            >
              Back to chat
            </button>
            <span>{previewMessage.fileName || "Shared media"}</span>
          </div>

          <div className="media-preview__body">
            {isPreviewVideo ? (
              <video
                className="media-preview__content"
                src={previewMessage.file}
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                className="media-preview__content"
                src={previewMessage.file}
                alt={previewMessage.fileName || "Shared upload"}
              />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ChatWindow;
