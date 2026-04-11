import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MoreVertical, Phone, Video, ChevronLeft, Trash2, Forward, X, MessageSquare, ChevronDown } from "lucide-react";

import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import TypingIndicator from "./TypingIndicator";
import ChatLanding from "./ChatLanding";

const DateSeparator = ({ date }) => (
  <div className="date-separator">
    <span className="date-separator__label">{date}</span>
  </div>
);

function formatDateSeparator(dateString) {
  if (!dateString) return "Today";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "History";

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
  } catch (e) {
    return "History";
  }
}

function ChatWindow({
  backgroundDoodle,
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
  const messagesContainerRef = useRef(null);
  const menuRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [previewMessage, setPreviewMessage] = useState(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [showNewPill, setShowNewPill] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isNearBottomRef = useRef(true);

  const hasSelection = selectedMessageIds.size > 0;

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
    if (!normalizedTerm) return chat?.messages ?? [];
    return (chat?.messages ?? []).filter((msg) => {
      const text = [
        msg.text,
        msg.fileName,
        msg.username,
        msg.deleted ? "This message was deleted" : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(normalizedTerm);
    });
  }, [chat?.messages, messageSearch]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    
    isNearBottomRef.current = distFromBottom < 100;
    
    if (isNearBottomRef.current) {
      setShowNewPill(false);
      setShowScrollBottom(false);
    } else {
      setShowScrollBottom(distFromBottom > 200); // Lower threshold for better UX
    }
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      setTimeout(() => setShowNewPill(false), 0);
    } else {
      setTimeout(() => setShowNewPill(true), 0);
    }
  }, [visibleMessages.length, typingText, callProps?.callStatus]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (previewMessage) setPreviewMessage(null);
        else if (hasSelection) setSelectedMessageIds(new Set());
        else if (isSearchOpen) { setIsSearchOpen(false); setMessageSearch(""); }
        else if (isMenuOpen) setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewMessage, isSearchOpen, isMenuOpen, hasSelection]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isMenuOpen]);

  const toggleSelection = useCallback((id) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleDeleteSelectedForMe = useCallback(() => {
    selectedMessageIds.forEach((id) => onDeleteMessageForMe(id));
    setSelectedMessageIds(new Set());
  }, [selectedMessageIds, onDeleteMessageForMe]);

  const handleForwardSelected = useCallback(() => {
    if (selectedMessageIds.size !== 1) return;
    const msg = chat.messages.find((m) => m.id === Array.from(selectedMessageIds)[0]);
    if (msg) onForwardMessage(msg);
    setSelectedMessageIds(new Set());
  }, [selectedMessageIds, chat?.messages, onForwardMessage]);

  // Render empty state on mobile if no chat
  if (!chat) {
    if (isMobileView) {
      return (
        <div className="chat-window">
          <div className="chat-window__empty">
            <div className="chat-window__empty-icon">
              <MessageSquare size={36} />
            </div>
            <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>Select a chat</p>
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Start a conversation</p>
          </div>
        </div>
      );
    }
    return <ChatLanding />;
  }

  return (
    <section className="chat-window" style={{ background: "transparent" }}>
      {/* ── Background Layer ───────────────────────────────────────────── */}
      {backgroundDoodle?.type === 'custom' && backgroundDoodle?.customUrl ? (
        <div 
          className="chat-bg-custom-container" 
          style={{ "--custom-bg-scrim": backgroundDoodle.opacity > 0.5 ? 0.3 : 0 }}
        >
          <img src={backgroundDoodle.customUrl} className="chat-bg-custom-img" alt="" />
        </div>
      ) : (
        <div 
          className={`chat-window__bg chat-bg-doodle-${backgroundDoodle?.type || 'light'}`}
          style={{ opacity: backgroundDoodle?.opacity || 0.3 }}
        />
      )}
      <header className={`chat-window__header${hasSelection ? " chat-window__header--selection" : ""}`}>

        {hasSelection ? (
          /* Bulk-selection action bar */
          <div className="chat-window__action-bar">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                className="icon-button"
                onClick={() => setSelectedMessageIds(new Set())}
              >
                <X size={20} />
              </button>
              <strong style={{ fontSize: 15 }}>{selectedMessageIds.size} selected</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {selectedMessageIds.size === 1 && (
                <button type="button" className="icon-button" title="Forward" onClick={handleForwardSelected}>
                  <Forward size={20} />
                </button>
              )}
              <button
                type="button"
                className="icon-button icon-button--danger"
                title="Delete"
                onClick={handleDeleteSelectedForMe}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

        ) : isSearchOpen ? (
          /* In-chat search bar */
          <div className="chat-window__search-bar" style={{ padding: "0 4px" }}>
            <button type="button" className="icon-button" onClick={() => { setIsSearchOpen(false); setMessageSearch(""); }}>
              <ChevronLeft size={24} />
            </button>
            <input
              autoFocus
              type="text"
              placeholder="Search messages…"
              value={messageSearch}
              onChange={(e) => setMessageSearch(e.target.value)}
            />
            {messageSearch.length > 0 && (
              <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                {visibleMessages.length} found
              </span>
            )}
          </div>

        ) : (
          /* Normal header */
          <>
            <div className="chat-window__identity">
              <button
                type="button"
                className="chat-window__back icon-button"
                onClick={onMobileBack}
                aria-label="Back"
              >
                <ChevronLeft size={26} />
              </button>

              <div
                className="chat-window__avatar"
                style={{ "--avatar-accent": chat.accent }}
                aria-hidden="true"
              >
                {chat.avatar}
              </div>

              <div style={{ minWidth: 0 }}>
                <h2>{chat.name || "Unknown User"}</h2>
                <p className={chat.status === "online" || chat.isTyping ? "is-online" : ""}>
                  {chat.isTyping
                    ? `${(chat.name || "Unknown").split(" ")[0]} is typing…`
                    : chat.lastSeen ?? ""}
                </p>
              </div>
            </div>

            <div className="chat-window__actions">
              <button
                type="button"
                className="icon-button icon-button--call"
                aria-label="Audio call"
                disabled={callProps?.callStatus === "calling" || callProps?.callStatus === "in-call"}
                onClick={onStartAudioCall}
              >
                <Phone size={19} />
              </button>
              <button
                type="button"
                className="icon-button icon-button--call"
                aria-label="Video call"
                disabled={callProps?.callStatus === "calling" || callProps?.callStatus === "in-call"}
                onClick={onStartVideoCall}
              >
                <Video size={19} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Search"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search size={19} />
              </button>

              {/* Three-dot menu */}
              <div className="chat-window__menu-shell" ref={menuRef}>
                <button
                  type="button"
                  className="icon-button chat-window__menu-trigger"
                  aria-label="More options"
                  onClick={() => setIsMenuOpen((v) => !v)}
                >
                  <MoreVertical size={20} />
                </button>
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      className="chat-window__menu"
                      initial={{ opacity: 0, scale: 0.92, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 8 }}
                      transition={{ duration: 0.14 }}
                    >
                      <button
                        type="button"
                        onClick={() => { onConfirmClearChat?.(); setIsMenuOpen(false); }}
                      >
                        Clear chat history
                      </button>
                      <button
                        type="button"
                        style={{ color: "var(--danger)" }}
                        onClick={() => { onConfirmDeleteChat?.(); setIsMenuOpen(false); }}
                      >
                        Delete chat
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </header>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div
        className="chat-window__messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {visibleMessages.length === 0 && isSearchOpen && (
          <div className="chat-window__empty-search">No messages matched your search.</div>
        )}

        {visibleMessages.map((message, index) => {
          const prevMessage = visibleMessages[index - 1];
          const currentDate = new Date(message.createdAt).toDateString();
          const prevDate = prevMessage ? new Date(prevMessage.createdAt).toDateString() : null;
          const showSeparator = currentDate !== prevDate;

          return (
            <div key={message.id || index}>
              {showSeparator && (
                <DateSeparator date={formatDateSeparator(message.createdAt)} />
              )}
              <MessageBubble
                message={message}
                searchTerm={messageSearch}
                isSelected={selectedMessageIds.has(message.id)}
                onToggleSelect={() => toggleSelection(message.id)}
                onPreview={setPreviewMessage}
                onReply={onReplyMessage}
                isSelectionMode={hasSelection}
              />
            </div>
          );
        })}

        <TypingIndicator text={typingText} />
        {/* Extra space at the bottom so messages aren't hidden by the floating input box */}
        <div 
          ref={messagesEndRef} 
          style={{ height: isMobileView ? "85px" : "90px" }} 
        />
 
      </div>
 
      {/* ── Floating Scroll Button ───────────────────────────────────────── */}
      <AnimatePresence>
        {(showScrollBottom || showNewPill) && (
          <motion.button
            key="scroll-bottom"
            className={`scroll-bottom-btn ${showNewPill ? 'has-new' : ''}`}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => {
              isNearBottomRef.current = true;
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              setShowNewPill(false);
              setShowScrollBottom(false);
            }}
            style={{
              position: "absolute",
              right: "20px",
              bottom: isMobileView ? "75px" : "80px", // Adjusted to sit exactly above the sleeker glass input bar
              zIndex: 100,
            }}
          >
            {showNewPill && <span className="scroll-bottom-btn__badge" />}
            <ChevronDown size={24} />
          </motion.button>
        )}
      </AnimatePresence>
 
      {/* ── Footer / input bar ──────────────────────────────────────────── */}
      <footer className="chat-window__footer">
        <InputBox
          disabled={callProps?.callStatus === "calling" || hasSelection}
          isCompact={isCompactInput}
          isMobile={isMobileView}
          value={draftMessage}
          onChange={onDraftChange}
          onClearReply={onClearReply}
          onFileUpload={onFileUpload}
          onSend={onSendMessage}
          replyMessage={replyMessage}
        />
      </footer>

      {/* ── Media preview modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {previewMessage && (
          <motion.div
            className="media-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
          >
            <div className="media-preview__header">
              <button
                type="button"
                className="media-preview__back"
                onClick={() => setPreviewMessage(null)}
              >
                <ChevronLeft size={20} /> Back
              </button>
              <span style={{ color: "#fff", fontSize: 14 }}>
                {previewMessage.fileName || "Shared media"}
              </span>
            </div>
            <div className="media-preview__body">
              {isPreviewVideo ? (
                <video
                  src={previewMessage.file}
                  controls
                  autoPlay
                  playsInline
                  style={{ maxWidth: "90%", maxHeight: "85vh", borderRadius: 14 }}
                />
              ) : (
                <img
                  src={previewMessage.file}
                  alt={previewMessage.fileName}
                  style={{ maxWidth: "90%", maxHeight: "85vh", borderRadius: 14, objectFit: "contain" }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default ChatWindow;
