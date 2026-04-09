import { useRef, useState } from "react";
import MessageStatus from "./MessageStatus";
import { getImageUrl, handleImageError } from "../utils/imageHelper";

const isImageFile = (msg) =>
  msg.type === "file" &&
  msg.file &&
  (msg.mimeType?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(msg.file));

const isVideoFile = (msg) =>
  msg.type === "file" &&
  msg.file &&
  (msg.mimeType?.startsWith("video/") || /\.(mp4|webm|ogg|mov)$/i.test(msg.file));

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
  isSelectionMode,
}) {
  const isOutgoing = message.sender === "me";
  const isFile     = message.type === "file" && message.file;
  const isImg      = isImageFile(message);
  const isVid      = isVideoFile(message);
  const canPreview = isImg || isVid;
  const [imageLoadError, setImageLoadError] = useState(false);

  const longPressRef = useRef(null);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    // Only handle primary button (left click / touch)
    if (e.button !== 0 && e.pointerType === "mouse") return;
    
    if (isSelectionMode) return;
    
    // Store starting position to check for move threshold
    touchStartPos.current = { x: e.clientX, y: e.clientY };
    
    // 500ms delay for long press - Slightly shorter for responsiveness
    longPressRef.current = window.setTimeout(() => {
      onToggleSelect();
      // Provide haptic feedback if available
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 450);
  };

  const handlePointerMove = (e) => {
    if (!longPressRef.current) return;
    
    // If finger moves more than 10 pixels, it's a scroll, not a long press
    const moveX = Math.abs(e.clientX - touchStartPos.current.x);
    const moveY = Math.abs(e.clientY - touchStartPos.current.y);
    
    if (moveX > 10 || moveY > 15) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handlePointerUpOrLeave = () => {
    window.clearTimeout(longPressRef.current);
    longPressRef.current = null;
  };

  const handleClick = (e) => {
    if (isSelectionMode) {
      e.stopPropagation();
      onToggleSelect();
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!isSelectionMode) onToggleSelect();
  };

  return (
    <article
      className={[
        "message",
        isOutgoing ? "message--outgoing" : "message--incoming",
        isSelected ? "message--selected" : "",
      ].join(" ").trim()}
      style={{
        padding: "2px 0",
        backgroundColor: isSelected
          ? "rgba(51, 144, 236, 0.15)"
          : "transparent",
        transition: "background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: isSelectionMode ? "pointer" : "default",
        userSelect: "none",
        position: "relative"
      }}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrLeave}
      onPointerLeave={handlePointerUpOrLeave}
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
            zIndex: 5
          }}
        />
      )}
      <div
        className={`message__bubble${
          isOutgoing ? " message__bubble--outgoing" : " message__bubble--incoming"
        }`}
        style={{ pointerEvents: isSelectionMode ? "none" : "auto" }}
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
          <span>{message.time}</span>
          {isOutgoing && <MessageStatus status={message.status} />}
        </div>
      </div>
    </article>
  );
}

export default MessageBubble;
