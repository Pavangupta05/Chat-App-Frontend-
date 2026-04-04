function TypingIndicator({ text }) {
  if (!text) {
    return null;
  }

  return (
    <div className="typing-indicator" aria-label={text}>
      <span />
      <span />
      <span />
      <p>{text}</p>
    </div>
  );
}

export default TypingIndicator;
