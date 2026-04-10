import { useEffect, useRef, useState } from "react";
import { formatListTime, getChatPreview } from "../utils/chat";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Menu, Sun, Moon, Edit, MessageSquare, Users, Trash2, UserPlus, User, Settings, Plus, X
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
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);


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
      <header className="sidebar__navbar" style={{ padding: "8px 16px", borderBottom: "1px solid var(--border-color)" }}>
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
              <span className="sidebar__status" style={{ fontSize: "11px", color: "var(--accent)" }}>{connectionLabel}</span>
            </div>
          </div>

          {/* RIGHT: Consolidated Action Menu + Theme switch */}
          {!isMobile && (
            <div className="sidebar__section-right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <AnimatePresence>
                  {sidebarMenuOpen && (
                    <div style={{ display: "flex", gap: "8px", marginRight: "8px" }}>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                        whileHover={{ scale: 1.1 }}
                        className="sidebar__action"
                        type="button"
                        onClick={() => { onNewGroup(); setSidebarMenuOpen(false); }}
                        title="New Group"
                      >
                        <Users size={18} />
                      </motion.button>
                      
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8, x: 10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 10 }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ delay: 0.05 }}
                        className="sidebar__action"
                        type="button"
                        onClick={() => { onNewChat(); setSidebarMenuOpen(false); }}
                        title="New Chat"
                      >
                        <UserPlus size={18} />
                      </motion.button>
                    </div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  className={`sidebar__action sidebar__action--main ${sidebarMenuOpen ? "is-active" : ""}`}
                  type="button"
                  onClick={() => setSidebarMenuOpen(!sidebarMenuOpen)}
                  aria-label="Toggle actions"
                >
                  {sidebarMenuOpen ? <X size={20} /> : <Plus size={20} />}
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                className="theme-switch"
                type="button"
                onClick={onThemeToggle}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
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
        </div>
      </div>

      {/* ── 3. TABS (Desktop Only) ────────────────────────────────────── */}
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
          // RENDER CONTACTS VIEW
          (() => {
            const contacts = Array.from(new Set(chats.map(c => c.name))).map(name => {
              return chats.find(c => c.name === name);
            }).sort((a, b) => a.name.localeCompare(b.name));

            if (contacts.length === 0) {
              return (
                <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                  <User size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
                  <p>No contacts found.</p>
                </div>
              );
            }

            return contacts.map((chat) => (
              <motion.div
                whileTap={{ scale: 0.98 }}
                key={`contact-${chat.id}`}
                role="button"
                tabIndex={0}
                className={`chat-list__item ${String(chat.id) === String(activeChatId) ? "is-active" : ""}`}
                onClick={() => onSelectChat(chat.id)}
                style={{
                  borderRadius: "12px",
                  margin: "2px 0",
                  padding: "10px 12px",
                }}
              >
                <div className="chat-list__avatar" style={{ "--avatar-accent": chat.accent, width: "40px", height: "40px" }}>
                  {chat.avatar}
                </div>
                <div className="chat-list__body">
                  <div className="chat-list__row">
                    <h2 style={{ fontSize: "15px" }}>{chat.name}</h2>
                  </div>
                  <div className="chat-list__row chat-list__row--secondary">
                    <p style={{ fontSize: "13px" }}>{chat.lastSeen || "Last seen recently"}</p>
                  </div>
                </div>
              </motion.div>
            ));
          })()
        ) : chats.length === 0 ? (
          // RENDER EMPTY CHATS
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: "48px 16px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px", filter: "grayscale(1)" }}>💬</div>
            <p style={{ fontSize: "14px" }}>No messages here yet...</p>
          </motion.div>
        ) : (
          // RENDER CHATS LIST
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
                style={{
                  borderRadius: "12px",
                  margin: "2px 0",
                  padding: "10px 12px",
                }}
              >
                <div
                  className="chat-list__avatar"
                  style={{ 
                    "--avatar-accent": chat.accent,
                    width: "50px",
                    height: "50px",
                    fontSize: "16px"
                  }}
                >
                  {chat.avatar}
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
                            transition: "opacity 0.2s"
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

export default Sidebar;
