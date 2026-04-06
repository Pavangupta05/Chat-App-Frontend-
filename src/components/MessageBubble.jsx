import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import MessageStatus from "./MessageStatus";

const isImageFileMessage = (message) =>
  message.type === "file" &&
  message.file &&
  (message.mimeType?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(message.file));

const isVideoFileMessage = (message) =>
  message.type === "file" &&
  message.file &&
  (message.mimeType?.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov)$/i.test(message.file));

/**
 * highlightText — wraps matched substrings with <mark> for search results.
 */
function highlightText(text, term) {
  if (!term || !text) return text;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="search-highlight">{part}</mark>
      : part
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
  const isOutgoing   = message.sender === "me";
  const isFileMessage = message.type === "file" && message.file;
  const isImageFile   = isImageFileMessage(message);
  const isVideoFile   = isVideoFileMessage(message);
  const canPreview    = isImageFile || isVideoFile;

  const longPressRef = useRef(null);

  const handlePointerDown = () => {
    // If we're already in selection mode, clicking should immediately toggle
    if (isSelectionMode) return;
    longPressRef.current = window.setTimeout(() => {
      onToggleSelect();
    }, 500); // 500ms long press to start selection
  };

  const handlePointerUpOrLeave = () => {
    window.clearTimeout(longPressRef.current);
  };

  const handleClick = (e) => {
    if (isSelectionMode) {
      e.stopPropagation();
      e.preventDefault();
      onToggleSelect();
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    onToggleSelect();
  };

  return (
    <article
      className={`message ${isOutgoing ? "message--outgoing" : "message--incoming"} ${isSelected ? "message--selected" : ""}`}
      style={{
        padding: isSelected ? "8px 12px" : "4px 0",
        backgroundColor: isSelected ? (isOutgoing ? "rgba(37, 99, 235, 0.15)" : "rgba(37, 99, 235, 0.08)") : "transparent",
        borderRadius: "12px",
        transition: "background-color 0.2s, padding 0.2s",
        cursor: isSelectionMode ? "pointer" : "default",
        userSelect: isSelectionMode ? "none" : "auto",
      }}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrLeave}
      onPointerLeave={handlePointerUpOrLeave}
      onClick={handleClick}
    >
      <div
        className={`message__bubble ${
          isOutgoing ? "message__bubble--outgoing" : "message__bubble--incoming"
        }`}
        style={{ pointerEvents: isSelectionMode ? "none" : "auto" }}
      >

        {!isOutgoing && message.username ? (
          <strong className="message__author">{message.username}</strong>
        ) : null}

        {message.replyTo ? (
          <div className="message__reply">
            <strong>{message.replyTo.username}</strong>
            <p>{message.replyTo.message}</p>
          </div>
        ) : null}

        {message.forwarded ? (
          <span className="message__forwarded">↪ Forwarded</span>
        ) : null}

        {message.deleted ? (
          <p className="message__deleted">🚫 This message was deleted</p>
        ) : isFileMessage ? (
          <div className="message__file">
            {canPreview ? (
              <button
                className="message__preview"
                type="button"
                onClick={() => !isSelectionMode && onPreview?.(message)}
              >
                {isImageFile ? (
                  <img
                    className="message__image"
                    src={message.file}
                    alt={message.fileName || "Shared upload"}
                    style={{ borderRadius: 12, display: "block" }}
                  />
                ) : (
                  <video 
                    className="message__video" 
                    src={message.file} 
                    muted 
                    playsInline 
                    style={{ borderRadius: 12, display: "block" }} 
                  />
                )}
              </button>
            ) : null}

            {!canPreview ? (
              <div className="message__file-card">
                <div className="message__file-meta">
                  <span className="message__file-icon">FILE</span>
                  <div>
                    <strong>{message.fileName || "Shared file"}</strong>
                    <small>{message.mimeType}</small>
                  </div>
                </div>
                <a className="message__file-link" href={message.file} download>Download</a>
              </div>
            ) : null}
          </div>
        ) : (
          <p>{highlightText(message.text, searchTerm)}</p>
        )}

        <div className="message__meta">
          <span>{message.time}</span>
          {isOutgoing ? <MessageStatus status={message.status} /> : null}
        </div>
      </div>
    </article>
  );
}

export default MessageBubble;
