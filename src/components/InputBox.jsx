import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Paperclip, Send, X } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import FileUpload from "./FileUpload";
import ReplyPreview from "./ReplyPreview";

function InputBox({
  disabled,
  isCompact,
  isMobile,
  onChange,
  onFileUpload,
  onSend,
  replyMessage,
  onClearReply,
  value,
}) {
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Auto-resize textarea logic
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "20px"; // Reset height to get scrollHeight
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [value]);

  const handleEmojiInsert = (emojiData) => {
    const emoji = emojiData.emoji;
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = value;
    const before = text.substring(0, start);
    const after = text.substring(end);

    onChange(before + emoji + after);
    
    // Position cursor after the emoji in the next tick
    setTimeout(() => {
      input.selectionStart = input.selectionEnd = start + emoji.length;
      input.focus();
    }, 0);
  };

  useEffect(() => {
    const handler = (e) => {
      if (isEmojiPickerOpen && !emojiPickerRef.current?.contains(e.target)) {
        setIsEmojiPickerOpen(false);
      }
    };
    // Use pointerdown for both mouse and touch
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, [isEmojiPickerOpen]);

  const handleChange = (e) => onChange(e.target.value);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend();
    }
  };

  const handleFileChange = (filePayload) => {
    if (filePayload?.mimeType?.startsWith("image/") && filePayload?.fileUrl) {
      setImagePreview({ url: filePayload.fileUrl, name: filePayload.fileName });
    } else {
      setImagePreview(null);
    }
    onFileUpload?.(filePayload);
  };

  const isSendable = Boolean(value?.trim());

  return (
    <div className="input-box-shell">
      <ReplyPreview message={replyMessage} onClose={onClearReply} />

      <AnimatePresence>
        {imagePreview && (
          <motion.div
            className="input-image-preview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
          >
            <img src={imagePreview.url} alt={imagePreview.name} />
            <button
              className="input-image-preview__close"
              type="button"
              aria-label="Remove preview"
              onClick={() => setImagePreview(null)}
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="input-box-container">
        <div className="input-box__actions-left" style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <div className="emoji-picker-anchor" ref={emojiPickerRef}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="icon-button"
              type="button"
              disabled={disabled}
              onClick={() => setIsEmojiPickerOpen((v) => !v)}
              style={{ color: "var(--text-secondary)" }}
            >
              <Smile size={24} />
            </motion.button>

            <AnimatePresence>
              {isEmojiPickerOpen && (
                <motion.div
                  className="emoji-picker-container-wrapper"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  style={{ 
                    position: "absolute", 
                    bottom: "100%", 
                    left: isMobile ? "-40px" : 0, 
                    marginBottom: 12, 
                    zIndex: 3000 
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="emoji-picker-close-btn"
                      onClick={() => setIsEmojiPickerOpen(false)}
                      title="Close"
                    >
                      <X size={14} />
                    </motion.button>
                    <EmojiPicker 
                      onEmojiClick={handleEmojiInsert} 
                      theme="dark"
                      lazyLoadEmojis={true}
                      skinTonesDisabled
                      searchDisabled={isMobile} // Disable internal search for mobile to save space
                      width={isMobile ? "calc(100vw - 32px)" : 320}
                      height={isMobile ? 320 : 400}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <FileUpload
            disabled={disabled}
            icon={
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="icon-button"
                style={{ color: "var(--text-secondary)" }}
              >
                <Paperclip size={24} />
              </motion.div>
            }
            onUploadComplete={handleFileChange}
          />
        </div>

        <textarea
          ref={inputRef}
          rows="1"
          placeholder={isCompact ? "Message" : "Type a message..."}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="chat-input-area"
        />

        <motion.button
          whileTap={isSendable ? { scale: 0.9 } : {}}
          className={`send-button-ios ${isSendable ? 'is-active' : ''}`}
          type="button"
          disabled={disabled || !isSendable}
          onClick={onSend}
          aria-label="Send message"
        >
          <Send size={20} style={{ transform: isSendable ? "translateX(2px)" : "none" }} />
        </motion.button>
      </div>
    </div>
  );
}

export default InputBox;
