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

  const handlePointerDown = () => {
    if (isSelectionMode) return;
    longPressRef.current = window.setTimeout(() => onToggleSelect(), 500);
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
      className={[
        "message",
        isOutgoing ? "message--outgoing" : "message--incoming",
        isSelected ? "message--selected" : "",
      ].join(" ").trim()}
      style={{
        padding: isSelected ? "6px 10px" : "2px 0",
        backgroundColor: isSelected
          ? "rgba(51, 144, 236, 0.12)"
          : "transparent",
        borderRadius: 10,
        transition: "background-color 0.18s, padding 0.18s",
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
