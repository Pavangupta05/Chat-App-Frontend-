import { useEffect, useRef, useState } from "react";
import { formatListTime, getChatPreview } from "../utils/chat";

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
      d="M5 7.25h14v1.5H5v-1.5Zm0 4h14v1.5H5v-1.5Zm0 4h14v1.5H5v-1.5Z"
      fill="currentColor"
    />
  </svg>
);

const PanelIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 5.75A1.75 1.75 0 0 1 5.75 4h12.5A1.75 1.75 0 0 1 20 5.75v12.5A1.75 1.75 0 0 1 18.25 20H5.75A1.75 1.75 0 0 1 4 18.25V5.75Zm1.5.09v12.32c0 .19.15.34.34.34H11V5.5H5.84a.34.34 0 0 0-.34.34Zm7 12.66h5.66a.34.34 0 0 0 .34-.34V5.84a.34.34 0 0 0-.34-.34H12.5v13Z"
      fill="currentColor"
    />
  </svg>
);

const ThemeIcon = ({ theme }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {theme === "dark" ? (
      <path
        d="M12 3.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V4a.75.75 0 0 1 .75-.75Zm0 14a5.25 5.25 0 1 0 0-10.5a5.25 5.25 0 0 0 0 10.5Zm8-4.75a.75.75 0 0 1 .75.75A8.75 8.75 0 1 1 12 3.25a.75.75 0 0 1 0 1.5a7.25 7.25 0 1 0 7.25 7.25a.75.75 0 0 1 .75-.75Zm-15.1 5.16a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06L4.9 18.72a.75.75 0 0 1 0-1.06Zm13.08 0a.75.75 0 0 1 1.06 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06Z"
        fill="currentColor"
      />
    ) : (
      <path
        d="M14.5 4.1A7.95 7.95 0 0 0 6.1 12.5c0 4.42 3.58 8 8 8c3.22 0 6-1.9 7.27-4.64a.75.75 0 0 0-.9-1.03a6.2 6.2 0 0 1-1.72.24c-3.87 0-7-3.13-7-7c0-1.05.24-2.06.67-2.96a.75.75 0 0 0-.92-1.01Z"
        fill="currentColor"
      />
    )}
  </svg>
);

const ComposeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const GroupIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const tabs = ["All Chats", "Groups", "Contacts"];
const menuItems = ["Profile", "Settings", "Logout"];

function Sidebar({
  activeChatId,
  activeTab,
  chats,
  connectionLabel,
  isOpen,
  onLogout,
  onNewChat,
  onNewGroup,
  onThemeToggle,
  onSearchChange,
  onSelectChat,
  onDeleteChat,
  onTabChange,
  onToggleSidebar,
  searchTerm,
  theme,
  username,
}) {
  const searchInputRef = useRef(null);
  const fabRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Close FAB menu on click outside
  useEffect(() => {
    if (!isFabOpen) return;
    const handler = (e) => {
      if (!fabRef.current?.contains(e.target)) setIsFabOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [isFabOpen]);

  return (
    <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`} style={{ position: "relative" }}>
      <div className="sidebar__navbar">
        <div className="sidebar__top">
          <div className="sidebar__profile">
            <div className="sidebar__profile-avatar" aria-hidden="true">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="sidebar__eyebrow">Signed in as</p>
              <h1 className="sidebar__title">{username}</h1>
              <span className="sidebar__status">{connectionLabel}</span>
            </div>
          </div>

          <div className="sidebar__controls">
            <button
              className="theme-switch"
              type="button"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              onClick={onThemeToggle}
            >
              <span className={`theme-switch__track ${theme === "dark" ? "is-active" : ""}`}>
                <span className="theme-switch__thumb">
                  <ThemeIcon theme={theme} />
                </span>
              </span>
            </button>
            <button
              className="sidebar__action"
              type="button"
              aria-label="Toggle sidebar width"
              onClick={onToggleSidebar}
            >
              <PanelIcon />
            </button>
            <button
              className="sidebar__action"
              type="button"
              aria-label="Open sidebar menu"
              onClick={() => setIsMenuOpen((v) => !v)}
            >
              <MenuIcon />
            </button>

            {isMenuOpen ? (
              <div className="sidebar__menu">
                {menuItems.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (item === "Logout") {
                        onLogout?.();
                      }
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <label className="searchbar sidebar__searchbar" htmlFor="chat-search">
          <SearchIcon />
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

      <div className="sidebar__tabs" role="tablist" aria-label="Chat categories">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`sidebar__tab ${tab === activeTab ? "is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === activeTab}
            onClick={() => onTabChange?.(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="chat-list">
        {chats.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
            No chats yet. Hit the <strong style={{ color: "var(--accent-strong)" }}>✏️</strong> button to start one!
          </div>
        ) : chats.map((chat) => {
          const preview = getChatPreview(chat);
          return (
            <button
              key={chat.id}
              type="button"
              className={`chat-list__item ${String(chat.id) === String(activeChatId) ? "is-active" : ""}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div
                className="chat-list__avatar"
                style={{ "--avatar-accent": chat.accent }}
                aria-hidden="true"
              >
                {chat.avatar}
              </div>

              <div className="chat-list__body">
                <div className="chat-list__row">
                  <h2>{chat.name}</h2>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span>{formatListTime(chat.updatedAt)}</span>
                    <button
                      type="button"
                      aria-label="Delete chat"
                      title="Delete chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat?.(chat.id);
                      }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--accent-strong)", fontSize: "16px", padding: 0,
                        opacity: 0.6, display: "flex"
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="chat-list__row chat-list__row--secondary">
                  <p className={chat.isTyping ? "is-typing" : ""}>{preview}</p>
                  {chat.unreadCount > 0 ? (
                    <span className="chat-list__badge">{chat.unreadCount}</span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <div ref={fabRef} style={{ position: "absolute", right: 16, bottom: 20, zIndex: 10 }}>
        {isFabOpen && (
          <div className="sidebar-fab-menu">
            <button
              type="button"
              className="sidebar-fab-item"
              onClick={() => { setIsFabOpen(false); onNewGroup?.(); }}
            >
              <span className="sidebar-fab-icon">
                <GroupIcon />
              </span>
              New Group
            </button>
            <button
              type="button"
              className="sidebar-fab-item"
              onClick={() => { setIsFabOpen(false); onNewChat?.(); }}
            >
              <span className="sidebar-fab-icon">
                <ChatIcon />
              </span>
              New Chat
            </button>
          </div>
        )}

        <button
          type="button"
          className="sidebar-fab"
          aria-label="New chat or group"
          aria-expanded={isFabOpen}
          onClick={() => setIsFabOpen((v) => !v)}
          style={{
            position: "static",
            transform: isFabOpen ? "rotate(45deg) scale(1.05)" : "rotate(0deg) scale(1)",
          }}
        >
          <ComposeIcon />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
