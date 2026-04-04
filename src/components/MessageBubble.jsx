import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import MessageMenu from "./MessageMenu";
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

const MENU_WIDTH  = 210;
const MENU_GAP    = 6;

function usePortalMenu() {
  const triggerRef = useRef(null);
  const menuRef    = useRef(null);
  const [isOpen, setIsOpen]       = useState(false);
  const [position, setPosition]   = useState({ top: 0, left: 0 });
  const longPressRef               = useRef(null);

  // Calculate fixed position from trigger button rect
  const openMenu = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      setIsOpen(true);
      return;
    }

    const spaceBelow  = window.innerHeight - rect.bottom;
    const spaceRight  = window.innerWidth  - rect.left;
    const menuHeight  = 260; // approximate

    const top  = spaceBelow >= menuHeight
      ? rect.bottom + MENU_GAP
      : rect.top - menuHeight - MENU_GAP;

    const left = spaceRight >= MENU_WIDTH
      ? rect.left
      : Math.max(8, rect.right - MENU_WIDTH);

    setPosition({ top, left });
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const onPointer = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const onKey = (e) => { if (e.key === "Escape") setIsOpen(false); };

    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  // Cleanup long-press timeout on unmount
  useEffect(() => () => window.clearTimeout(longPressRef.current), []);

  return { triggerRef, menuRef, isOpen, position, openMenu, closeMenu, longPressRef };
}

function MessageBubble({
  message,
  onDeleteForEveryone,
  onDeleteForMe,
  onForward,
  onPreview,
  onReply,
}) {
  const isOutgoing   = message.sender === "me";
  const isFileMessage = message.type === "file" && message.file;
  const isImageFile   = isImageFileMessage(message);
  const isVideoFile   = isVideoFileMessage(message);
  const canPreview    = isImageFile || isVideoFile;

  const { triggerRef, menuRef, isOpen, position, openMenu, closeMenu, longPressRef } =
    usePortalMenu();

  const handleCopy = async () => {
    const valueToCopy = message.type === "file" ? message.file : message.text;
    if (!valueToCopy) return;
    await navigator.clipboard.writeText(valueToCopy);
    closeMenu();
  };

  return (
    <article
      className={`message ${isOutgoing ? "message--outgoing" : "message--incoming"}`}
      onContextMenu={(e) => { e.preventDefault(); openMenu(); }}
      onPointerDown={() => {
        longPressRef.current = window.setTimeout(openMenu, 500);
      }}
      onPointerUp={() => window.clearTimeout(longPressRef.current)}
      onPointerLeave={() => window.clearTimeout(longPressRef.current)}
    >
      <div
        className={`message__bubble ${
          isOutgoing ? "message__bubble--outgoing" : "message__bubble--incoming"
        }`}
      >
        {/* Three-dot trigger */}
        <button
          ref={triggerRef}
          className="message__menu-trigger"
          type="button"
          aria-label="Open message menu"
          aria-expanded={isOpen}
          onClick={(e) => { e.stopPropagation(); openMenu(); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="5"  r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>

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
                onClick={() => onPreview?.(message)}
                aria-label={`Preview ${message.fileName || "shared media"}`}
              >
                {isImageFile ? (
                  <img
                    className="message__image"
                    src={message.file}
                    alt={message.fileName || "Shared upload"}
                  />
                ) : (
                  <video className="message__video" src={message.file} muted playsInline />
                )}
              </button>
            ) : null}

            {!canPreview ? (
              <div className="message__file-card">
                <div className="message__file-meta">
                  <span className="message__file-icon" aria-hidden="true">
                    {message.mimeType?.startsWith("video/")
                      ? "VID"
                      : message.mimeType?.startsWith("audio/")
                        ? "AUD"
                        : "FILE"}
                  </span>
                  <div>
                    <strong>{message.fileName || "Shared file"}</strong>
                    <small>{message.mimeType || "Download attachment"}</small>
                  </div>
                </div>
                <a
                  className="message__file-link"
                  href={message.file}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download
                </a>
              </div>
            ) : (
              <a
                className="message__file-link"
                href={message.file}
                target="_blank"
                rel="noreferrer"
              >
                {isImageFile ? "Open original file" : "Download media"}
              </a>
            )}
          </div>
        ) : (
          <p>{message.text}</p>
        )}

        <div className="message__meta">
          <span>{message.time}</span>
          {isOutgoing ? <MessageStatus status={message.status} /> : null}
        </div>
      </div>

      {/* Portal menu — rendered at document.body, escapes all overflow containers */}
      {isOpen
        ? createPortal(
            <div
              ref={menuRef}
              className="message-menu-portal"
              style={{
                position: "fixed",
                top:  position.top,
                left: position.left,
                width: MENU_WIDTH,
                zIndex: 9999,
              }}
            >
              <MessageMenu
                isDeleted={message.deleted}
                onCopy={handleCopy}
                onDeleteForEveryone={() => { onDeleteForEveryone?.(message.id); closeMenu(); }}
                onDeleteForMe={() => { onDeleteForMe?.(message.id); closeMenu(); }}
                onForward={() => { onForward?.(message); closeMenu(); }}
                onReply={() => { onReply?.(message); closeMenu(); }}
              />
            </div>,
            document.body,
          )
        : null}
    </article>
  );
}

export default MessageBubble;
