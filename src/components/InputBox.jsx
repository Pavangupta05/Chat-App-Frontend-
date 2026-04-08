import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Paperclip, Send, X } from "lucide-react";
import EmojiPicker from "./EmojiPicker";
import FileUpload from "./FileUpload";
import ReplyPreview from "./ReplyPreview";

function InputBox({
  disabled,
  isCompact,
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

  const handleEmojiInsert = (emoji) => {
    onChange(`${value}${emoji}`);
    setIsEmojiPickerOpen(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handler = (e) => {
      if (!emojiPickerRef.current?.contains(e.target)) {
        setIsEmojiPickerOpen(false);
      }
    };
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

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
        <div className="input-box__actions-left" style={{ display: "flex", alignItems: "center", gap: "2px", marginBottom: "2px" }}>
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
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 12, zIndex: 30 }}
                >
                  <EmojiPicker onSelect={handleEmojiInsert} />
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
