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
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // { url, name }

  const handleEmojiInsert = (emoji) => {
    onChange(`${value}${emoji}`);
    setIsEmojiPickerOpen(false);
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!emojiPickerRef.current?.contains(event.target)) {
        setIsEmojiPickerOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleChange = (event) => {
    onChange(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  // Handle file selection preview (images only) before upload
  const handleFileChange = (filePayload) => {
    if (filePayload?.mimeType?.startsWith("image/") && filePayload?.fileUrl) {
      setImagePreview({ url: filePayload.fileUrl, name: filePayload.fileName });
    } else {
      setImagePreview(null);
    }
    onFileUpload?.(filePayload);
  };

  return (
    <div className="input-box-shell">
      <ReplyPreview message={replyMessage} onClose={onClearReply} />

      {/* Image preview strip */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            className="input-image-preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <img src={imagePreview.url} alt={imagePreview.name} />
            <button
              className="input-image-preview__close"
              type="button"
              aria-label="Remove preview"
              onClick={() => setImagePreview(null)}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="input-box">
        <div className="emoji-picker-anchor" ref={emojiPickerRef}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="icon-button"
            type="button"
            aria-label="Insert emoji"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setIsEmojiPickerOpen((currentValue) => !currentValue)}
          >
            <Smile size={20} strokeWidth={2.2} />
          </motion.button>

          <AnimatePresence>
            {isEmojiPickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 8 }}
              >
                <EmojiPicker onSelect={handleEmojiInsert} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <FileUpload
          disabled={disabled}
          icon={(
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Paperclip size={20} strokeWidth={2.2} />
            </motion.div>
          )}
          onUploadComplete={handleFileChange}
        />

        <input
          type="text"
          placeholder={isCompact ? "Message" : "Write a message"}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.85 }}
          className="send-button"
          type="button"
          aria-label="Send message"
          disabled={disabled || !value.trim()}
          onClick={onSend}
          style={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center" }}
        >
          <motion.div
             initial={{ x: 0 }}
             whileTap={{ x: 4, scale: 0.9, opacity: 0.8 }}
          >
            <Send size={18} strokeWidth={2.5} />
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}

export default InputBox;
