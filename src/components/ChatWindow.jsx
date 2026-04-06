import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, Phone, Video, ChevronLeft, Trash2, Forward, X } from "lucide-react";

import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import TypingIndicator from "./TypingIndicator";

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
  const messagesContainerRef = useRef(null);
  const menuRef = useRef(null);
  
  // States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [previewMessage, setPreviewMessage] = useState(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [showNewPill, setShowNewPill] = useState(false);
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

  // Track whether user is near the bottom
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distFromBottom < 120;
    if (isNearBottomRef.current) setShowNewPill(false);
  }, []);

  // Smart scroll — only jump to bottom if user is near bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      setShowNewPill(false);
    } else {
      setShowNewPill(true);
    }
  }, [visibleMessages.length, typingText, callProps?.callStatus]);

  // Handle escape keys for modals and menus
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (previewMessage) setPreviewMessage(null);
        else if (hasSelection) setSelectedMessageIds(new Set());
        else if (isSearchOpen) {
          setIsSearchOpen(false);
          setMessageSearch("");
        }
        else if (isMenuOpen) setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewMessage, isSearchOpen, isMenuOpen, hasSelection]);

  // Handle menu click outside
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isMenuOpen]);

  const toggleSelection = useCallback((messageId) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }, []);

  const handleDeleteSelectedForMe = useCallback(() => {
    selectedMessageIds.forEach(id => onDeleteMessageForMe(id));
    setSelectedMessageIds(new Set());
  }, [selectedMessageIds, onDeleteMessageForMe]);

  const handleDeleteSelectedForEveryone = useCallback(() => {
    selectedMessageIds.forEach(id => onDeleteMessageForEveryone(id));
    setSelectedMessageIds(new Set());
  }, [selectedMessageIds, onDeleteMessageForEveryone]);

  const handleForwardSelected = useCallback(() => {
    if (selectedMessageIds.size !== 1) return;
    const firstId = Array.from(selectedMessageIds)[0];
    const msg = chat.messages.find(m => m.id === firstId);
    if (msg) onForwardMessage(msg);
    setSelectedMessageIds(new Set());
  }, [selectedMessageIds, chat?.messages, onForwardMessage]);


  if (!chat) return null;

  return (
    <section className="chat-window" style={{ zIndex: 10, background: "var(--app-background)" }}>
      
      {/* 
        Chat Header Region
      */}
      <header className={`chat-window__header ${hasSelection ? "chat-window__header--selection" : ""}`}>
        
        {hasSelection ? (
          <div className="chat-window__action-bar" style={{ display: "flex", alignItems: "center", width: "100%", height: "100%", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button 
                type="button" 
                className="icon-button" 
                onClick={() => setSelectedMessageIds(new Set())}
              >
                <X size={20} />
              </button>
              <strong style={{ fontSize: "1.1rem" }}>{selectedMessageIds.size} selected</strong>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {selectedMessageIds.size === 1 && (
                <button 
                  type="button" 
                  className="icon-button"
                  title="Forward Message"
                  onClick={handleForwardSelected}
                >
                  <Forward size={20} />
                </button>
              )}
              <button 
                type="button" 
                className="icon-button icon-button--danger" 
                title="Delete for Everyone (if eligible) or Me"
                style={{ color: "var(--danger)" }}
                onClick={() => {
                  // Usually, modern apps prompt here. E.g. a small alert or dropdown.
                  // For simplicity, we trigger DeleteForMe. You could swap to Everyone.
                  handleDeleteSelectedForMe();
                }}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ) : isSearchOpen ? (
          <div className="chat-window__search-bar" style={{ display: "flex", alignItems: "center", width: "100%", padding: "0 16px", gap: 12 }}>
            <button type="button" className="icon-button" onClick={() => { setIsSearchOpen(false); setMessageSearch(""); }}>
              <ChevronLeft size={24} />
            </button>
            <input
              type="text"
              autoFocus
              placeholder="Search in this chat..."
              value={messageSearch}
              onChange={(e) => setMessageSearch(e.target.value)}
              style={{ flex: 1, border: "none", background: "var(--surface-hover)", padding: "10px 16px", borderRadius: 20, outline: "none" }}
            />
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              {messageSearch.length > 0 ? `${visibleMessages.length} found` : ""}
            </span>
          </div>
        ) : (
          <>
            <div className="chat-window__identity">
              {isMobileView ? (
                <button 
                  className="chat-window__back icon-button" 
                  type="button" 
                  onClick={onMobileBack}
                  aria-label="Back to chat list"
                  style={{ marginRight: "8px" }}
                >
                  <ChevronLeft size={28} />
                </button>
              ) : null}

              <div className="chat-window__avatar" style={{ "--avatar-accent": chat.accent }} aria-hidden="true">
                 {chat.avatar}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: "1.1rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {chat.name}
                </h2>
                <p className={chat.status === "online" || chat.isTyping ? "is-online" : ""} style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                <Phone size={20} />
              </button>
              <button
                className="icon-button icon-button--call"
                type="button"
                aria-label="Start video call"
                disabled={callProps?.callStatus === "calling" || callProps?.callStatus === "in-call"}
                onClick={onStartVideoCall}
              >
                <Video size={20} />
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label="Search"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search size={20} />
              </button>

              <div className="chat-window__menu-shell" ref={menuRef} style={{ position: "relative" }}>
                <button
                  className="icon-button chat-window__menu-trigger"
                  type="button"
                  onClick={() => setIsMenuOpen((v) => !v)}
                >
                  <Menu size={20} />
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="chat-window__menu"
                      style={{ position: "absolute", top: "100%", right: 0, width: "200px" }}
                    >
                      <button type="button" onClick={() => { onConfirmClearChat?.(); setIsMenuOpen(false); }}>
                        Clear Chat History
                      </button>
                      <button type="button" onClick={() => { onConfirmDeleteChat?.(); setIsMenuOpen(false); }} style={{ color: "var(--danger)" }}>
                        Delete Chat
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </header>

      <div className="chat-window__messages">
        {visibleMessages.length === 0 && isSearchOpen && (
          <div className="chat-window__empty-search" style={{ textAlign: "center", color: "var(--text-muted)", marginTop: 40 }}>
            No messages matched your search.
          </div>
        )}

        {visibleMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isSelected={selectedMessageIds.has(message.id)}
            onToggleSelect={() => toggleSelection(message.id)}
            onPreview={setPreviewMessage}
            onReply={onReplyMessage}
            isSelectionMode={hasSelection}
          />
        ))}

        <TypingIndicator text={typingText} />

        {/* 16px padding hack at bottom to avoid sticking closely */}
        <div ref={messagesEndRef} style={{ height: 16 }} />
      </div>

      <footer className="chat-window__footer" style={{ padding: "8px 16px", background: "var(--app-background)" }}>
        <InputBox
          disabled={callProps?.callStatus === "calling" || hasSelection}
          isCompact={isCompactInput}
          value={draftMessage}
          onChange={onDraftChange}
          onClearReply={onClearReply}
          onFileUpload={onFileUpload}
          onSend={onSendMessage}
          replyMessage={replyMessage}
        />
      </footer>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {previewMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="media-preview"
            role="dialog"
            style={{ backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0.8)" }}
          >
            <div className="media-preview__header" style={{ padding: 16 }}>
              <button
                className="media-preview__back"
                type="button"
                onClick={() => setPreviewMessage(null)}
              >
                <ChevronLeft size={24} /> Back
              </button>
              <span style={{ color: "#fff" }}>{previewMessage.fileName || "Shared media"}</span>
            </div>

            <div className="media-preview__body" style={{ display: "grid", placeItems: "center", height: "calc(100% - 64px)" }}>
              {isPreviewVideo ? (
                <video src={previewMessage.file} controls autoPlay playsInline style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 16 }} />
              ) : (
                <img src={previewMessage.file} alt={previewMessage.fileName} style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 16, objectFit: "contain" }} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default ChatWindow;
