import { useEffect, useRef, useState } from "react";
import { formatListTime, getChatPreview } from "../utils/chat";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, PanelLeft, Sun, Moon, Edit, MessageSquare, Users, Trash2, UserPlus } from "lucide-react";
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
  const searchInputRef = useRef(null);
  const fabRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  const isMobile = viewport === "mobile";

  // Close FAB menu on click outside
  useEffect(() => {
    if (!isFabOpen) return;
    const handler = (e) => {
      if (!fabRef.current?.contains(e.target)) setIsFabOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [isFabOpen]);

  const currentMode = activeTab === "Contacts" ? "contacts" : "chats";

  return (
    <aside className={`sidebar ${isOpen ? "sidebar--open" : "sidebar--closed"}`}>
      {/* 1. HEADER SECTION */}
      <header className="sidebar__navbar">
        <div className="sidebar__top">
          {/* LEFT: Menu and Profile */}
          <div className="sidebar__section-left" style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="sidebar__action"
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
            >
              <Menu size={20} />
            </motion.button>
            
            <div className="sidebar__profile-avatar" onClick={onProfile} style={{ cursor: "pointer" }}>
              {username.slice(0, 2).toUpperCase()}
            </div>
            
            <div className="sidebar__profile-info" style={{ minWidth: 0 }}>
              <h1 className="sidebar__title" style={{ fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>{username}</h1>
              <span className="sidebar__status" style={{ fontSize: "0.8rem", opacity: 0.7 }}>{connectionLabel}</span>
            </div>
          </div>

          {/* RIGHT: Add User, Toggle, and Icons */}
          <div className="sidebar__section-right" style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="sidebar__action sidebar__action--add"
              type="button"
              aria-label="Add User/New Chat"
              onClick={onNewChat}
              style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center" }}
            >
              <UserPlus size={18} />
            </motion.button>

            <ModeToggle 
              mode={currentMode} 
              onToggle={(mode) => onTabChange(mode === "chats" ? "All Chats" : "Contacts")} 
            />

            <motion.button
              whileTap={{ scale: 0.9 }}
              className="theme-switch"
              type="button"
              onClick={onThemeToggle}
            >
              <span className={`theme-switch__track ${theme === "dark" ? "is-active" : ""}`}>
                <motion.span 
                  className="theme-switch__thumb"
                  layout
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                >
                  {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
                </motion.span>
              </span>
            </motion.button>
            
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="sidebar__menu"
                  style={{ left: isMobile ? 16 : "auto", right: isMobile ? "auto" : 16 }}
                >
                  <button type="button" onClick={() => { setIsMenuOpen(false); onProfile?.(); }}>Profile</button>
                  <button type="button" onClick={() => { setIsMenuOpen(false); onSettings?.(); }}>Settings</button>
                  <button type="button" onClick={() => { setIsMenuOpen(false); onLogout?.(); }} style={{ color: "var(--danger)" }}>Logout</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* 2. SEARCH BAR SECTION */}
      <div style={{ padding: "0 12px" }}>
        <label className="searchbar sidebar__searchbar" htmlFor="chat-search" style={{ marginTop: "10px", display: "flex", width: "100%" }}>
          <Search size={16} />
          <input
            ref={searchInputRef}
            id="chat-search"
            type="text"
            placeholder="Search or start new chat"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>

      {/* 3. TABS SECTION */}
      <div className="sidebar__tabs" role="tablist" aria-label="Chat categories" style={{ marginTop: "12px" }}>
        {tabs.map((tab) => (
          <motion.button
            whileTap={{ scale: 0.95 }}
            key={tab}
            className={`sidebar__tab ${tab === activeTab ? "is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === activeTab}
            onClick={() => onTabChange?.(tab)}
          >
            {tab}
          </motion.button>
        ))}
      </div>

      <div className="chat-list">
        {chats.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
            No chats yet. Hit the <strong style={{ color: "var(--accent-strong)" }}>✏️</strong> button to start one!
          </motion.div>
        ) : chats.map((chat) => {
          const preview = getChatPreview(chat);
          return (
            <motion.button
              whileHover={{ backgroundColor: "rgba(255,255,255,0.4)" }}
              whileTap={{ scale: 0.98 }}
              key={chat.id}
              type="button"
              className={`chat-list__item ${String(chat.id) === String(activeChatId) ? "is-active" : ""}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div
                className="chat-list__avatar"
                style={{ "--avatar-accent": chat.accent, position: "relative" }}
                aria-hidden="true"
              >
                {chat.avatar}
                {isUserOnline?.(String(chat.id)) && (
                  <span className="online-dot" aria-label="Online" />
                )}
              </div>

              <div className="chat-list__body">
                <div className="chat-list__row">
                  <h2>{chat.name}</h2>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span>{formatListTime(chat.updatedAt)}</span>
                    <motion.button
                      whileHover={{ scale: 1.2, color: "var(--danger)" }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      aria-label="Delete chat"
                      title="Delete chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat?.(chat.id);
                      }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--text-muted)", padding: 0,
                        display: "flex"
                      }}
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>

                <div className="chat-list__row chat-list__row--secondary">
                  <p className={chat.isTyping ? "is-typing" : ""}>{preview}</p>
                  {chat.unreadCount > 0 ? (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="chat-list__badge"
                    >
                      {chat.unreadCount}
                    </motion.span>
                  ) : null}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <div ref={fabRef} style={{ position: "absolute", right: 16, bottom: 20, zIndex: 10 }}>
        <AnimatePresence>
          {isFabOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="sidebar-fab-menu"
              style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="sidebar-fab-item"
                onClick={() => { setIsFabOpen(false); onNewGroup?.(); }}
                style={{ padding: "10px 16px", borderRadius: 20, border: "none", background: "var(--surface)", boxShadow: "var(--shadow-menu)", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, color: "var(--accent-strong)" }}
              >
                <Users size={18} />
                New Group
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="sidebar-fab-item"
                onClick={() => { setIsFabOpen(false); onNewChat?.(); }}
                style={{ padding: "10px 16px", borderRadius: 20, border: "none", background: "var(--surface)", boxShadow: "var(--shadow-menu)", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, color: "var(--accent-strong)" }}
              >
                <MessageSquare size={18} />
                New Chat
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          className="sidebar-fab"
          aria-label="New chat or group"
          aria-expanded={isFabOpen}
          onClick={() => setIsFabOpen((v) => !v)}
          style={{
            width: 56, height: 56, borderRadius: 28, border: "none",
            background: "var(--accent-gradient)", color: "white",
            display: "grid", placeItems: "center", cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)"
          }}
          animate={{ rotate: isFabOpen ? 45 : 0 }}
        >
          <Edit size={24} />
        </motion.button>
      </div>
    </aside>
  );
}

export default Sidebar;
