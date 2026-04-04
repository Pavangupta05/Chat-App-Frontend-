import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUsers } from "../services/userService";

const ACCENT_COLORS = [
  "#7c3aed", "#2563eb", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#db2777", "#7c3aed",
];

const PRESET_AVATARS = ["😊", "🚀", "🎯", "💡", "🔥", "⭐", "🎨", "🤝", "🌟", "💬"];

function getInitials(name) {
  if (!name.trim()) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function readStoredToken() {
  try {
    return window.localStorage.getItem("chat-token") || "";
  } catch {
    return "";
  }
}

function NewChatModal({ isOpen, mode = "chat", onClose, onCreate }) {
  const { token: contextToken } = useAuth();
  const token = contextToken || readStoredToken();
  const inputRef = useRef(null);
  const [name, setName] = useState("");
  const [accent, setAccent] = useState(ACCENT_COLORS[0]);
  const [emoji, setEmoji] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsError, setContactsError] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setName("");
      setEmoji("");
      setAccent(ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)]);
      setIsSubmitting(false);
      setContactsError("");
      if (mode === "chat" && token) {
        setContactsLoading(true);
        fetchUsers(token)
          .then(setContacts)
          .catch((err) => setContactsError(err.message || "Could not load contacts."))
          .finally(() => setContactsLoading(false));
      } else {
        setContacts([]);
      }
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, mode, token]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePickContact = (userRecord) => {
    setIsSubmitting(true);
    setTimeout(() => {
      onCreate?.({
        peerUserId: userRecord.id,
        name: userRecord.username,
        accent,
        avatar: emoji || null,
      });
      setIsSubmitting(false);
    }, 120);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "chat") {
      return;
    }
    if (!name.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      inputRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      onCreate?.({ name: name.trim(), accent, avatar: emoji || null });
      setIsSubmitting(false);
    }, 320);
  };

  const displayAvatar = emoji || getInitials(name);
  const title = mode === "group" ? "New Group" : "New Chat";
  const subtitle = mode === "group"
    ? "Create a group chat room for everyone to join"
    : "Choose someone registered on this server";

  return (
    <div
      className="modal-backdrop ncm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ncm-card">
        {/* Header */}
        <div className="ncm-header">
          <div className="ncm-header-text">
            <h2 className="ncm-title">{title}</h2>
            <p className="ncm-subtitle">{subtitle}</p>
          </div>
          <button className="ncm-close" type="button" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Avatar preview */}
        <div className="ncm-avatar-row">
          <div
            className="ncm-avatar-preview"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}
            aria-hidden="true"
          >
            {displayAvatar}
          </div>

          {/* Color picker */}
          <div className="ncm-colors">
            <p className="ncm-label">Accent color</p>
            <div className="ncm-color-swatches">
              {ACCENT_COLORS.slice(0, 7).map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`ncm-swatch ${accent === color ? "ncm-swatch--active" : ""}`}
                  style={{ background: color }}
                  aria-label={`Select color ${color}`}
                  onClick={() => setAccent(color)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Emoji picker row */}
        <div className="ncm-emoji-row">
          <p className="ncm-label">Quick emoji avatar (optional)</p>
          <div className="ncm-emoji-grid">
            {PRESET_AVATARS.map((em) => (
              <button
                key={em}
                type="button"
                className={`ncm-emoji-btn ${emoji === em ? "ncm-emoji-btn--active" : ""}`}
                onClick={() => setEmoji((cur) => (cur === em ? "" : em))}
                aria-label={`Use ${em} as avatar`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {mode === "chat" ? (
          <div className="ncm-form">
            <p className="ncm-label">Contacts</p>
            {contactsLoading ? (
              <p className="ncm-subtitle" style={{ marginTop: 8 }}>Loading…</p>
            ) : null}
            {contactsError ? (
              <p className="ncm-subtitle" style={{ marginTop: 8, color: "var(--danger, #c00)" }}>{contactsError}</p>
            ) : null}
            {!contactsLoading && !contactsError && !contacts.length ? (
              <p className="ncm-subtitle" style={{ marginTop: 8 }}>
                No other users yet. Register a second account or ask someone to sign up.
              </p>
            ) : null}
            <ul className="ncm-contact-list" style={{ listStyle: "none", padding: 0, margin: "12px 0 0", maxHeight: 220, overflowY: "auto" }}>
              {contacts.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="ncm-btn ncm-btn--ghost"
                    style={{ width: "100%", justifyContent: "flex-start", marginBottom: 8 }}
                    disabled={isSubmitting}
                    onClick={() => handlePickContact(u)}
                  >
                    <span style={{ fontWeight: 600 }}>{u.username}</span>
                    <span style={{ opacity: 0.7, marginLeft: 8, fontSize: 12 }}>{u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="ncm-actions" style={{ marginTop: 16 }}>
              <button type="button" className="ncm-btn ncm-btn--ghost" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ncm-form">
            <div className={`ncm-field ${shake ? "ncm-field--shake" : ""}`}>
              <label htmlFor="ncm-name-input" className="ncm-label">
                Group name
              </label>
              <input
                ref={inputRef}
                id="ncm-name-input"
                className="ncm-input"
                type="text"
                maxLength={40}
                placeholder="e.g. Design Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
              <span className="ncm-char-count">{name.length}/40</span>
            </div>

            <div className="ncm-actions">
              <button type="button" className="ncm-btn ncm-btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className={`ncm-btn ncm-btn--primary ${isSubmitting ? "ncm-btn--submitting" : ""}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="ncm-spinner" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    Create Group
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default NewChatModal;
