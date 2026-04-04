function ForwardModal({ chats, message, onClose, onForward }) {
  if (!message) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Forward message">
      <div className="modal-card">
        <div className="modal-card__header">
          <div>
            <h3>Forward message</h3>
            <p>Select a chat to forward this message to.</p>
          </div>
          <button className="modal-card__close" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="forward-list">
          {chats.map((chat) => (
            <button
              key={chat.id}
              className="forward-list__item"
              type="button"
              onClick={() => onForward(chat.id)}
            >
              <div
                className="forward-list__avatar"
                style={{ "--avatar-accent": chat.accent }}
                aria-hidden="true"
              >
                {chat.avatar}
              </div>
              <div>
                <strong>{chat.name}</strong>
                <span>{chat.messages.at(-1)?.deleted ? "This message was deleted" : chat.messages.at(-1)?.text || chat.messages.at(-1)?.fileName || "No recent messages"}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ForwardModal;
