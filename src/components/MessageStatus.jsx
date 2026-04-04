function MessageStatus({ status }) {
  if (!status) {
    return null;
  }

  if (status === "sent") {
    return <span className="message-status">✓</span>;
  }

  return (
    <span className={`message-status ${status === "seen" ? "message-status--seen" : ""}`}>
      ✓✓
    </span>
  );
}

export default MessageStatus;
