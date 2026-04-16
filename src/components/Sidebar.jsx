import { useEffect, useRef, useState } from "react";
import { formatListTime, getChatPreview } from "../utils/chat";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Menu, Sun, Moon, MessageSquare, Users, Trash2, User, Settings, X,
  Phone, Video, ChevronLeft, Plus
} from "lucide-react";
import { ChatListSkeleton } from "./SkeletonLoaders";

const tabs = ["All Chats", "Groups", "Contacts"];

function Sidebar({
  activeChatId,
  activeTab,
  chats,
  connectionLabel,
  isOpen,
  isUserOnline,
  onLogout,
  onProfile,
  onSettings,
  onThemeToggle,
  onSearchChange,
  onSelectChat,
  onDeleteChat,
  onTabChange,
  searchTerm,
  theme,
  username,
  viewport,
}) {
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isMobile = viewport === "mobile";
  const isConnecting = connectionLabel === "Connecting…" || connectionLabel?.startsWith("Connect");

  // Close hamburger dropdown on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [isMenuOpen]);

  const handlePanEnd = (e, info) => {
    const threshold = 50;
    const velocityThreshold = 200;
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) onTabChange?.(tabs[currentIndex - 1]);
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) onTabChange?.(tabs[currentIndex + 1]);
    }
  };

  return (
    <aside className={`sidebar${isOpen ? "" : " sidebar--closed"}`}>

      {/* ── 1. HEADER ─────────────────────────────────────────────────── */}
      <header className="sidebar__navbar">
        <div className="sidebar__top" style={{ height: "auto", minHeight: "48px", padding: 0 }}>

          {/* LEFT: Hamburger + Avatar + Name */}
          <div className="sidebar__section-left" ref={menuRef} style={{ gap: "12px" }}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              className="sidebar__action"
              type="button"
              aria-label="Menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((v) => !v)}
              style={{ width: "32px", height: "32px" }}
            >
              <Menu size={20} />
            </motion.button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  className="sidebar__menu"
                  initial={{ opacity: 0, scale: 0.94, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -8 }}
                  transition={{ duration: 0.15 }}
                  style={{ top: "48px", left: "0" }}
                >
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); onProfile?.(); }}
                  >
                    <User size={16} style={{ marginRight: "12px" }} /> Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); onSettings?.(); }}
                  >
                    <Settings size={16} style={{ marginRight: "12px" }} /> Settings
                  </button>
                  <div style={{ height: "1px", background: "var(--border-color)", margin: "4px 0" }} />
                  <button
                    type="button"
                    style={{ color: "var(--danger)" }}
                    onClick={() => { setIsMenuOpen(false); onLogout?.(); }}
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className="sidebar__profile-avatar"
              onClick={onProfile}
              style={{ width: "34px", height: "34px" }}
            >
              {username?.slice(0, 2).toUpperCase() || "?"}
            </div>

            <div className="sidebar__profile-info" style={{ gap: "2px" }}>
              <h1 className="sidebar__title" style={{ fontSize: "16px" }}>{username}</h1>
              <span
                className="sidebar__status"
                style={{
                  fontSize: "11px",
                  color: isConnecting ? "var(--text-muted)" : "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {!isConnecting && (
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#4ade80",
                    display: "inline-block",
                    flexShrink: 0,
                  }} />
                )}
                {connectionLabel}
              </span>
            </div>
          </div>

          {/* RIGHT: Theme toggle */}
          {!isMobile && (
            <div className="sidebar__section-right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="sidebar__action"
                type="button"
                onClick={onThemeToggle}
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </motion.button>
            </div>
          )}
        </div>
      </header>

      {/* ── 2. SEARCH ─────────────────────────────────────────────────── */}
      <div style={{ padding: "12px 16px" }}>
        <div className="sidebar__searchbar" style={{ margin: 0, height: "40px", borderRadius: "10px" }}>
          <Search size={16} style={{ color: "var(--text-muted)" }} />
          <input
            id="sidebar-search"
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ fontSize: "15px" }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── 3. TABS ────────────────────────────────────────────────────── */}
      <div className="sidebar__tabs" role="tablist" style={{ padding: "0 16px 12px", gap: "8px" }}>
        {tabs.map((tab) => (
          <motion.button
            whileTap={{ scale: 0.95 }}
            key={tab}
            className={`sidebar__tab${tab === activeTab ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === activeTab}
            onClick={() => onTabChange?.(tab)}
            style={{ fontSize: "14px", height: "32px", borderRadius: "8px" }}
          >
            {tab}
          </motion.button>
        ))}
      </div>

      {/* ── 4. CHAT LIST / CONTACTS LIST ──────────────────────────────── */}
      <motion.div
        className="chat-list"
        style={{ padding: "0 8px", flex: 1, overflowY: "auto" }}
        onPanEnd={handlePanEnd}
      >
        {activeTab === "Contacts" ? (
          <ContactsTab
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={onSelectChat}
          />
        ) : isConnecting && chats.length === 0 ? (
          // Show skeleton while connecting and no chats loaded
          <ChatListSkeleton />
        ) : chats.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="sidebar__empty-state"
          >
            <div className="sidebar__empty-icon">
              <MessageSquare size={40} />
            </div>
            <p className="sidebar__empty-title">No chats yet</p>
            <p className="sidebar__empty-sub">Tap the + button to start a new conversation</p>
          </motion.div>
        ) : (
          chats.map((chat) => {
            const preview = getChatPreview(chat);
            const isActive = String(chat.id) === String(activeChatId);
            return (
              <motion.div
                whileTap={{ scale: 0.98 }}
                key={chat.id}
                role="button"
                tabIndex={0}
                className={`chat-list__item ${isActive ? "is-active" : ""}`}
                onClick={() => onSelectChat(chat.id)}
                style={{ borderRadius: "12px", margin: "2px 0", padding: "10px 12px" }}
              >
                <div
                  className="chat-list__avatar"
                  style={{
                    "--avatar-accent": chat.accent,
                    width: "50px",
                    height: "50px",
                    fontSize: "16px",
                  }}
                >
                  {chat.avatar?.length > 4 ? (
                    <img src={chat.avatar} alt={chat.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    chat.avatar
                  )}
                  {isUserOnline?.(String(chat.id)) && (
                    <span className="online-dot" style={{ width: "12px", height: "12px", border: "2px solid var(--sidebar-surface)" }} />
                  )}
                </div>

                <div className="chat-list__body">
                  <div className="chat-list__row">
                    <h2 style={{ fontSize: "16px" }}>{chat.name}</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px" }}>{formatListTime(chat.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="chat-list__row chat-list__row--secondary" style={{ marginTop: "2px" }}>
                    <p className={chat.isTyping ? "is-typing" : ""} style={{ fontSize: "14px" }}>{preview}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {chat.unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="chat-list__badge"
                        >
                          {chat.unreadCount}
                        </motion.span>
                      )}

                      {!isMobile && (
                        <button
                          type="button"
                          className="delete-hover-btn"
                          onClick={(e) => { e.stopPropagation(); onDeleteChat?.(chat.id); }}
                          style={{
                            background: "none", border: "none", padding: "4px",
                            cursor: "pointer", color: "var(--text-muted)",
                            display: "flex", opacity: isActive ? 0.7 : 0,
                            transition: "opacity 0.2s",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

    </aside>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CONTACTS TAB — Stories row + detail card
   ══════════════════════════════════════════════════════════════════ */
function ContactsTab({ chats, activeChatId, onSelectChat }) {
  const [selectedContact, setSelectedContact] = useState(null);

  const contacts = Array.from(
    new Map(chats.map((c) => [c.name, c])).values()
  ).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  if (contacts.length === 0) {
    return (
      <div className="sidebar__empty-state">
        <div className="sidebar__empty-icon"><User size={40} /></div>
        <p className="sidebar__empty-title">No contacts yet</p>
        <p className="sidebar__empty-sub">Start a new chat to add contacts</p>
      </div>
    );
  }

  /* ── Contact detail card ──────────────────────────────────────── */
  if (selectedContact) {
    const c = selectedContact;
    const initials = c.name?.slice(0, 2).toUpperCase() || "?";
    return (
      <motion.div
        className="contact-card"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        {/* Back button */}
        <button
          className="contact-card__back"
          onClick={() => setSelectedContact(null)}
          aria-label="Back to contacts"
        >
          <ChevronLeft size={22} />
          <span>Contacts</span>
        </button>

        {/* Avatar hero */}
        <div className="contact-card__hero">
          <div
            className="contact-card__avatar-large"
            style={{ "--avatar-accent": c.accent }}
          >
            {c.avatar?.length > 4 ? (
              <img src={c.avatar} alt={c.name}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : initials}
          </div>
          <h2 className="contact-card__name">{c.name}</h2>
          <p className="contact-card__status">
            {c.lastSeen || "Last seen recently"}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="contact-card__actions">
          <button
            className="contact-card__action-btn"
            onClick={() => onSelectChat(c.id)}
            aria-label="Message"
          >
            <MessageSquare size={22} />
            <span>Message</span>
          </button>
          <button
            className="contact-card__action-btn"
            onClick={() => onSelectChat(c.id)}
            aria-label="Voice call"
          >
            <Phone size={22} />
            <span>Audio</span>
          </button>
          <button
            className="contact-card__action-btn"
            onClick={() => onSelectChat(c.id)}
            aria-label="Video call"
          >
            <Video size={22} />
            <span>Video</span>
          </button>
        </div>

        {/* Info rows */}
        <div className="contact-card__info">
          <div className="contact-card__info-row">
            <span className="contact-card__info-label">About</span>
            <span className="contact-card__info-value">Hey there! I am using ChatApp</span>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Stories/avatar row ──────────────────────────────────────── */
  return (
    <div className="contacts-list">
      {/* Horizontal story-style avatar row */}
      <div className="contacts-stories" role="list" aria-label="Contacts">
        {/* You */}
        <div className="contacts-stories__item" role="listitem">
          <div className="contacts-stories__avatar contacts-stories__avatar--add">
            <Plus size={20} />
          </div>
          <span className="contacts-stories__name">You</span>
        </div>

        {contacts.map((c) => {
          const initials = c.name?.slice(0, 2).toUpperCase() || "?";
          return (
            <motion.div
              key={`story-${c.id}`}
              className="contacts-stories__item"
              role="listitem"
              whileTap={{ scale: 0.93 }}
              onClick={() => setSelectedContact(c)}
            >
              <div
                className="contacts-stories__avatar"
                style={{ "--avatar-accent": c.accent }}
              >
                {c.avatar?.length > 4 ? (
                  <img src={c.avatar} alt={c.name}
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : initials}
              </div>
              <span className="contacts-stories__name">{c.name?.split(" ")[0]}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Full contact list below */}
      <div className="contacts-list__divider">All Contacts</div>
      {contacts.map((c) => {
        const initials = c.name?.slice(0, 2).toUpperCase() || "?";
        return (
          <motion.div
            key={`contact-row-${c.id}`}
            className={`chat-list__item ${String(c.id) === String(activeChatId) ? "is-active" : ""}`}
            onClick={() => setSelectedContact(c)}
            whileTap={{ scale: 0.98 }}
            style={{ borderRadius: "12px", margin: "2px 0", padding: "10px 12px" }}
            role="button"
            tabIndex={0}
          >
            <div
              className="chat-list__avatar"
              style={{ "--avatar-accent": c.accent, width: "44px", height: "44px", fontSize: "15px" }}
            >
              {c.avatar?.length > 4 ? (
                <img src={c.avatar} alt={c.name}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : initials}
            </div>
            <div className="chat-list__body">
              <div className="chat-list__row">
                <h2 style={{ fontSize: "15px" }}>{c.name}</h2>
              </div>
              <div className="chat-list__row chat-list__row--secondary">
                <p style={{ fontSize: "13px" }}>{c.lastSeen || "Last seen recently"}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default Sidebar;
