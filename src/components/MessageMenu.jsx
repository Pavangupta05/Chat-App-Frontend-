const ReplyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
    <path d="M9 11L4 6l5-5M4 6h9a7 7 0 0 1 0 14h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ForwardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
    <path d="M15 11l5-5-5-5M20 6h-9a7 7 0 0 0 0 14h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const DeleteMeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DeleteAllIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function MessageMenu({
  isDeleted,
  onCopy,
  onDeleteForEveryone,
  onDeleteForMe,
  onForward,
  onReply,
  style,
}) {
  return (
    <div className="message-menu" style={style} role="menu">
      {!isDeleted ? (
        <button type="button" className="message-menu__item" role="menuitem" onClick={onReply}>
          <span className="message-menu__icon message-menu__icon--reply"><ReplyIcon /></span>
          Reply
        </button>
      ) : null}
      {!isDeleted ? (
        <button type="button" className="message-menu__item" role="menuitem" onClick={onForward}>
          <span className="message-menu__icon message-menu__icon--forward"><ForwardIcon /></span>
          Forward
        </button>
      ) : null}
      {!isDeleted ? (
        <button type="button" className="message-menu__item" role="menuitem" onClick={onCopy}>
          <span className="message-menu__icon message-menu__icon--copy"><CopyIcon /></span>
          Copy
        </button>
      ) : null}
      <div className="message-menu__divider" />
      <button type="button" className="message-menu__item message-menu__item--danger" role="menuitem" onClick={onDeleteForMe}>
        <span className="message-menu__icon"><DeleteMeIcon /></span>
        Delete for me
      </button>
      {!isDeleted ? (
        <button type="button" className="message-menu__item message-menu__item--danger" role="menuitem" onClick={onDeleteForEveryone}>
          <span className="message-menu__icon"><DeleteAllIcon /></span>
          Delete for everyone
        </button>
      ) : null}
    </div>
  );
}

export default MessageMenu;
