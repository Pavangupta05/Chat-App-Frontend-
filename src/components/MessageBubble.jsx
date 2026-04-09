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

  // Detect if message is purely emojis (up to 3) for large rendering
  const isOnlyEmoji = useMemo(() => {
    if (!message.text || message.type === "file") return false;
    // Regex for emojis (very simplified but effective for most common ones)
    const emojiRegex = /^(\u2702|\u2705|\u2708|\u2709|\u270A-\u270D|\u270F|\u2712|\u2714|\u2716|\u271D|\u2721|\u2728|\u2733|\u2734|\u2744|\u2747|\u274C|\u274E|\u2753-\u2755|\u2757|\u2763|\u2764|\u2795-\u2797|\u27A1|\u27B0|\u27BF|\u2934|\u2935|\u2B05-\u2B07|\u2B1B|\u2B1C|\u2B50|\u2B55|\u3030|\u303D|\u3297|\u3299|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96-\uDF9B\uDF9E-\uDFA0\uDFA2-\uDFAF\uDFB1-\uDFBF\uDFC1-\uDFC4\uDFC6-\uDFCA\uDFCE-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F-\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA5\uDDA8\uDDB1\uDDB2\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0-\uDEF3]|\uD83E[\uDD10-\uDD1E\uDD20-\uDD27\uDD30\uDD33-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4B\uDD50-\uDD5E\uDD80-\uDD91\uDDC0])[\s\uFE0F]*$/u;
    
    // Split by whitespace and check each character
    const chars = Array.from(message.text.trim());
    if (chars.length > 3) return false;
    
    // Simple check: if removing emojis leaves nothing but whitespace
    const emojiOnly = message.text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '').trim().length === 0;
    return emojiOnly && chars.length <= 3;
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
        className={bubbleClass}
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
