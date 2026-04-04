function ReplyPreview({ message, onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className="reply-preview">
      <div className="reply-preview__content">
        <strong>{message.username}</strong>
        <p>{message.message}</p>
      </div>
      <button type="button" className="reply-preview__close" onClick={onClose} aria-label="Cancel reply">
        x
      </button>
    </div>
  );
}

export default ReplyPreview;
