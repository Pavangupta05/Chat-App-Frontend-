import { useRef, useState, useMemo, useCallback, useEffect, memo } from "react";
import MessageStatus from "./MessageStatus";
import MessageReactions from "./MessageReactions";
import { getImageUrl, handleImageError } from "../utils/imageHelper";

const isImageFile = (msg) =>
  msg.type === "file" &&
  msg.file &&
  (msg.mimeType?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(msg.file));

const isVideoFile = (msg) =>
  msg.type === "file" &&
  msg.file &&
  (msg.mimeType?.startsWith("video/") || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(msg.file));

function highlightText(text, term) {
  if (!term || !text) return text;
  const regex = new RegExp(
    `(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function MessageBubble({
  message,
  searchTerm,
  isSelected,
  onToggleSelect,
  onPreview,
  onReply,
  onForward,
  onDeleteForMe,
  onDeleteForEveryone,
  onPin,
  isSelectionMode,
}) {
  const isOutgoing = message.sender === "me";
  const isFile     = message.type === "file" && message.file;
  const isImg      = isImageFile(message);
  const isVid      = isVideoFile(message);
  const canPreview = isImg || isVid;
  
  const [imageLoadError, setImageLoadError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bubbleRef = useRef(null);
  const [clickRect, setClickRect] = useState(null);

  const handleClick = (e) => {
    if (isSelectionMode) {
      e.stopPropagation();
      onToggleSelect();
      return;
    }
    if (e.target.closest("button") || e.target.closest("a")) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Capture rect before opening
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      setClickRect(rect);
      setMenuOpen(true);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSelectionMode) {
      if (bubbleRef.current) {
        const rect = bubbleRef.current.getBoundingClientRect();
        setClickRect(rect);
        setMenuOpen(true);
      }
    }
  };

  // Helper to format time safely
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  useEffect(() => {
    if (!menuOpen) setClickRect(null);
  }, [menuOpen]);

  // Detect if message is purely emojis (up to 3) for large rendering
  const isOnlyEmoji = useMemo(() => {
    if (!message.text || message.type === "file") return false;
    const chars = Array.from(message.text.trim());
    if (chars.length > 3) return false;
    // Simple emoji regex
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    const textWithoutEmojis = message.text.replace(emojiRegex, '').trim();
    return textWithoutEmojis.length === 0 && chars.length <= 3;
  }, [message.text, message.type]);

  const bubbleClass = [
    "message__bubble",
    isOutgoing ? "message__bubble--outgoing" : "message__bubble--incoming",
    isOnlyEmoji ? "message__bubble--emoji-only" : "",
  ].join(" ").trim();

  return (
    <article
      className={[
        "message",
        isOutgoing ? "message--outgoing" : "message--incoming",
        isSelected ? "message--selected" : "",
        isSelectionMode ? "message--selectable" : "",
      ].join(" ").trim()}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      {isSelected && (
        <div
          className="message-selection-overlay"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "4px",
            height: "100%",
            backgroundColor: "var(--accent)",
            zIndex: 5,
          }}
        />
      )}

      {/* Reactions & Context Menu wrapper */}
      <MessageReactions
        isOutgoing={isOutgoing}
        message={message}
        menuOpen={menuOpen}
        triggerRect={clickRect}
        onCloseMenu={() => setMenuOpen(false)}
        onReply={() => onReply(message)}
        onForward={onForward}
        onSelect={onToggleSelect}
        onPin={onPin}
        onDeleteForMe={onDeleteForMe}
        onDeleteForEveryone={onDeleteForEveryone}
      >
        <div
          ref={bubbleRef}
          className={bubbleClass}
          style={{ 
            pointerEvents: isSelectionMode ? "none" : "auto",
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)" 
          }}
        >
          {/* Sender name (group / incoming) */}
          {!isOutgoing && message.username && (
            <strong className="message__author">{message.username}</strong>
          )}

          {/* Forwarded label */}
          {message.forwarded && (
            <span className="message__forwarded">↪ Forwarded</span>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <div className="message__reply">
              <strong>{message.replyTo.username}</strong>
              <p>{message.replyTo.message}</p>
            </div>
          )}

          {/* Content */}
          {message.deleted ? (
            <p className="message__deleted">🚫 This message was deleted</p>
          ) : isFile ? (
            <div className="message__file">
              {canPreview ? (
                <button
                  className="message__preview"
                  type="button"
                  onClick={() => !isSelectionMode && onPreview?.(message)}
                >
                  {isImg ? (
                    imageLoadError ? (
                      <div className="message__image-error">
                        <span>🖼️ Image unavailable</span>
                      </div>
                    ) : (
                      <img
                        className="message__image"
                        src={getImageUrl(message.file)}
                        alt={message.fileName || "Image"}
                        onError={(e) => {
                          setImageLoadError(true);
                          handleImageError(e);
                        }}
                        loading="lazy"
                      />
                    )
                  ) : (
                    <video
                      className="message__video"
                      src={getImageUrl(message.file)}
                      muted
                      playsInline
                      onError={() => console.warn("❌ Video failed to load:", message.file)}
                    />
                  )}
                </button>
              ) : (
                <div className="message__file-card">
                  <div className="message__file-meta">
                    <span className="message__file-icon">FILE</span>
                    <div>
                      <strong>{message.fileName || "Shared file"}</strong>
                      <small>{message.mimeType}</small>
                    </div>
                  </div>
                  <a className="message__file-link" href={getImageUrl(message.file)} download>
                    Download
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p>{highlightText(message.text, searchTerm)}</p>
          )}

          {/* Timestamp + read status */}
          <div className="message__meta">
            <span>{formatTime(message.time || message.createdAt)}</span>
            {isOutgoing && <MessageStatus status={message.status} />}
          </div>
        </div>
      </MessageReactions>
    </article>
  );
}

export default memo(MessageBubble);
