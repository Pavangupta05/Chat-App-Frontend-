import { useEffect, useRef, useState } from "react";
import EmojiPicker from "./EmojiPicker";
import FileUpload from "./FileUpload";
import ReplyPreview from "./ReplyPreview";

const SmileIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 3.75A8.25 8.25 0 1 0 20.25 12A8.26 8.26 0 0 0 12 3.75Zm0-1.5A9.75 9.75 0 1 1 2.25 12A9.76 9.76 0 0 1 12 2.25Zm-3 7a1 1 0 1 0 0 2a1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2a1 1 0 0 0 0-2Zm-5.09 4.6l-1.3.75a4.25 4.25 0 0 0 6.78 0l-1.3-.75a2.75 2.75 0 0 1-4.18 0Z"
      fill="currentColor"
    />
  </svg>
);

const AttachmentIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M15.75 6.25v8.88a3.75 3.75 0 1 1-7.5 0V5.88a2.63 2.63 0 0 1 5.25 0v8.25a1.13 1.13 0 1 1-2.25 0V7.25h-1.5v6.88a2.63 2.63 0 1 0 5.25 0V5.88a4.13 4.13 0 1 0-8.25 0v9.25a5.25 5.25 0 1 0 10.5 0V6.25h-1.5Z"
      fill="currentColor"
    />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M20.84 3.16a1.25 1.25 0 0 0-1.28-.28L4.1 8.03a1.25 1.25 0 0 0 .09 2.39l6.42 1.96l1.96 6.42a1.25 1.25 0 0 0 2.39.09l5.15-15.46a1.25 1.25 0 0 0-.27-1.27Zm-2.59 2.13l-4.1 12.31l-1.44-4.73a1.25 1.25 0 0 0-.83-.83l-4.73-1.44l12.3-4.1l-7.04 7.04l1.06 1.06l7.04-7.05Z"
      fill="currentColor"
    />
  </svg>
);

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

  return (
    <div className="input-box-shell">
      <ReplyPreview message={replyMessage} onClose={onClearReply} />

      <div className="input-box">
        <div className="emoji-picker-anchor" ref={emojiPickerRef}>
          <button
            className="icon-button"
            type="button"
            aria-label="Insert emoji"
            onClick={() => setIsEmojiPickerOpen((currentValue) => !currentValue)}
          >
            <SmileIcon />
          </button>

          {isEmojiPickerOpen ? <EmojiPicker onSelect={handleEmojiInsert} /> : null}
        </div>

        <FileUpload
          disabled={disabled}
          icon={<AttachmentIcon />}
          onUploadComplete={onFileUpload}
        />

        <input
          type="text"
          placeholder={isCompact ? "Message" : "Write a message"}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />

        <button
          className="send-button"
          type="button"
          aria-label="Send message"
          disabled={disabled}
          onClick={onSend}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

export default InputBox;

