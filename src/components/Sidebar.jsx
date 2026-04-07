import { useEffect, useRef, useState } from "react";
import { formatListTime, getChatPreview } from "../utils/chat";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Menu, Sun, Moon, Edit, MessageSquare, Users, Trash2, UserPlus,
} from "lucide-react";
import ModeToggle from "./ModeToggle";

const tabs = ["All Chats", "Groups", "Contacts"];

function Sidebar({
  activeChatId,
  activeTab,
  chats,
  connectionLabel,
  isOpen,
  isUserOnline,
  onLogout,
  onNewChat,
  onNewGroup,
  onProfile,
  onSettings,
  onThemeToggle,
  onSearchChange,
  onSelectChat,
  onDeleteChat,
  onTabChange,
  onToggleSidebar,
  searchTerm,
  theme,
  username,
  viewport,
}) {
  const fabRef = useRef(null);
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  const isMobile = viewport === "mobile";
  const currentMode = activeTab === "Contacts" ? "contacts" : "chats";

  // Close hamburger dropdown on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [isMenuOpen]);

  // Close FAB on outside click
  useEffect(() => {
    if (!isFabOpen) return;
    const handler = (e) => {
      if (!fabRef.current?.contains(e.target)) setIsFabOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [isFabOpen]);

  return (
    <aside className={`sidebar${isOpen ? "" : " sidebar--closed"}`}>

      {/* ── 1. HEADER ─────────────────────────────────────────────────── */}
      <header className="sidebar__navbar">
        <div className="sidebar__top">

          {/* LEFT: Hamburger + Avatar + Name */}
          <div className="sidebar__section-left" ref={menuRef}>
            {/* Hamburger that opens dropdown */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              className="sidebar__action"
              type="button"
              aria-label="Menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((v) => !v)}
            >
              <Menu size={20} />
            </motion.button>

            {/* Dropdown menu anchored to hamburger (must use div, not inside button, to avoid nested button error) */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  className="sidebar__menu"
                  initial={{ opacity: 0, scale: 0.94, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); onProfile?.(); }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); onSettings?.(); }}
                  >
                    Settings
                  </button>
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

            {/* Avatar */}
            <div
              className="sidebar__profile-avatar"
              onClick={onProfile}
              title="Your profile"
              aria-label="Profile"
            >
              {username?.slice(0, 2).toUpperCase() || "?"}
            </div>

            {/* Name + status */}
            <div className="sidebar__profile-info">
              <h1 className="sidebar__title">{username}</h1>
              <span className="sidebar__status">{connectionLabel}</span>
            </div>
          </div>

          {/* RIGHT: Add user + Mode toggle + Theme switch */}
          <div className="sidebar__section-right">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              className="sidebar__action"
              type="button"
              aria-label="New chat"
              onClick={onNewChat}
            >
              <UserPlus size={18} />
            </motion.button>

            <ModeToggle
              mode={currentMode}
              onToggle={(mode) => onTabChange(mode === "chats" ? "All Chats" : "Contacts")}
            />

            {/* Light/dark toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="theme-switch"
              type="button"
              aria-label="Toggle theme"
              onClick={onThemeToggle}
            >
              <span className={`theme-switch__track${theme === "light" ? " is-active" : ""}`}>
                <motion.span
                  className="theme-switch__thumb"
                  layout
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                >
                  {theme === "light" ? <Sun size={12} /> : <Moon size={12} />}
                </motion.span>
              </span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── 2. SEARCH ─────────────────────────────────────────────────── */}
      <div style={{ padding: "0 12px" }}>
        <label
          className="sidebar__searchbar"
          htmlFor="sidebar-search"
        >
          <Search size={15} />
          <input
            id="sidebar-search"
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>
      </div>

      {/* ── 3. TABS ───────────────────────────────────────────────────── */}
      <div className="sidebar__tabs" role="tablist" aria-label="Chat categories">
        {tabs.map((tab) => (
          <motion.button
            whileTap={{ scale: 0.95 }}
            key={tab}
            className={`sidebar__tab${tab === activeTab ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === activeTab}
            onClick={() => onTabChange?.(tab)}
          >
            {tab}
          </motion.button>
        ))}
      </div>

      {/* ── 4. CHAT LIST ──────────────────────────────────────────────── */}
      <div className="chat-list">
        {chats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
            <p>No chats yet. Tap the <strong style={{ color: "var(--accent)" }}>✏</strong> button to start one!</p>
          </motion.div>
        ) : (
          chats.map((chat) => {
            const preview = getChatPreview(chat);
            return (
              <motion.button
                whileTap={{ scale: 0.99 }}
                key={chat.id}
                type="button"
                className={`chat-list__item${String(chat.id) === String(activeChatId) ? " is-active" : ""}`}
                onClick={() => onSelectChat(chat.id)}
              >
                {/* Avatar with online dot */}
                <div
                  className="chat-list__avatar"
                  style={{ "--avatar-accent": chat.accent }}
                  aria-hidden="true"
                >
                  {chat.avatar}
                  {isUserOnline?.(String(chat.id)) && (
                    <span className="online-dot" aria-label="Online" />
                  )}
                </div>

                {/* Body */}
                <div className="chat-list__body">
                  <div className="chat-list__row">
                    <h2>{chat.name}</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span>{formatListTime(chat.updatedAt)}</span>
                      {/* Delete button */}
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        aria-label="Delete chat"
                        onClick={(e) => { e.stopPropagation(); onDeleteChat?.(chat.id); }}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--text-muted)", display: "flex", padding: 0,
                        }}
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    </div>
                  </div>

                  <div className="chat-list__row chat-list__row--secondary">
                    <p className={chat.isTyping ? "is-typing" : ""}>{preview}</p>
                    {chat.unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="chat-list__badge"
                      >
                        {chat.unreadCount}
                      </motion.span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      {/* ── 5. FAB (Compose) ──────────────────────────────────────────── */}
      <div
        ref={fabRef}
        style={{ position: "absolute", right: 16, bottom: 20, zIndex: 10 }}
      >
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.85 }}
              style={{
                position: "absolute", bottom: "100%", right: 0,
                marginBottom: 10, display: "flex", flexDirection: "column", gap: 8,
              }}
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                className="sidebar-fab-item"
                onClick={() => { setIsFabOpen(false); onNewGroup?.(); }}
              >
                <Users size={17} /> New Group
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                className="sidebar-fab-item"
                onClick={() => { setIsFabOpen(false); onNewChat?.(); }}
              >
                <MessageSquare size={17} /> New Chat
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          type="button"
          className="sidebar-fab"
          aria-label="New chat or group"
          aria-expanded={isFabOpen}
          onClick={() => setIsFabOpen((v) => !v)}
          animate={{ rotate: isFabOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Edit size={22} />
        </motion.button>
      </div>
    </aside>
  );
}

export default Sidebar;
