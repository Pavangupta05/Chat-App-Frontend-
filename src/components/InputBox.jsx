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

  const handleEmojiInsert = (emoji) => {
    onChange(`${value}${emoji}`);
    setIsEmojiPickerOpen(false);
    inputRef.current?.focus();
  };

  // Close emoji picker on outside click
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
      {/* Reply preview */}
      <ReplyPreview message={replyMessage} onClose={onClearReply} />

      {/* Image preview strip */}
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

      {/* Main input row */}
      <div className="input-box">
        {/* Left actions: emoji + attach */}
        <div className="input-box__actions-left">
          {/* Emoji picker */}
          <div className="emoji-picker-anchor" ref={emojiPickerRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.88 }}
              className="icon-button"
              type="button"
              aria-label="Emoji"
              disabled={disabled}
              onClick={() => setIsEmojiPickerOpen((v) => !v)}
            >
              <Smile size={20} strokeWidth={2} />
            </motion.button>

            <AnimatePresence>
              {isEmojiPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 340, damping: 26 }}
                  style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 8, zIndex: 30 }}
                >
                  <EmojiPicker onSelect={handleEmojiInsert} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* File attach */}
          <FileUpload
            disabled={disabled}
            icon={
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.88 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Paperclip size={20} strokeWidth={2} />
              </motion.div>
            }
            onUploadComplete={handleFileChange}
          />
        </div>

        {/* Text input — grows to fill */}
        <input
          ref={inputRef}
          type="text"
          placeholder={isCompact ? "Message" : "Write a message…"}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{ flex: 1, minWidth: 0 }}
        />

        {/* Send button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.88 }}
          className="send-button"
          type="button"
          aria-label="Send message"
          disabled={disabled || !isSendable}
          onClick={onSend}
        >
          <Send size={17} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}

export default InputBox;
