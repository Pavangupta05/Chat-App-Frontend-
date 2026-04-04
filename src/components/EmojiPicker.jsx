const emojiGroups = [
  {
    title: "Smileys",
    emojis: [
      "😀", "😁", "😂", "🤣", "😊", "😍", "🥰", "😘", "😎", "🤩",
      "🙂", "😉", "🤗", "🤔", "🫡", "😴", "😭", "😡", "🥳", "🤯",
    ],
  },
  {
    title: "People",
    emojis: [
      "👍", "👋", "🙏", "👏", "🙌", "🤝", "💪", "🫶", "👌", "✌️",
      "🤟", "👀", "🧠", "💃", "🕺", "👨‍💻", "👩‍💻", "🧑‍💼", "🧑‍🎨", "🧑‍🚀",
    ],
  },
  {
    title: "Nature",
    emojis: [
      "🌟", "🔥", "🌈", "☀️", "🌙", "⭐", "🌸", "🌴", "🍀", "🌊",
      "🐶", "🐱", "🦊", "🐼", "🦄", "🐬", "🦋", "🌹", "🍎", "🍕",
    ],
  },
  {
    title: "Objects",
    emojis: [
      "💡", "📱", "💻", "⌚", "🎧", "📷", "🎁", "💎", "🛒", "🎯",
      "🚀", "✈️", "🚗", "🏠", "🎉", "📌", "📝", "📎", "🔒", "❤️",
    ],
  },
];

function EmojiPicker({ onSelect }) {
  return (
    <div className="emoji-picker" role="dialog" aria-label="Emoji picker">
      {emojiGroups.map((group) => (
        <section key={group.title} className="emoji-picker__group">
          <h4>{group.title}</h4>
          <div className="emoji-picker__grid">
            {group.emojis.map((emoji) => (
              <button
                key={`${group.title}-${emoji}`}
                className="emoji-picker__item"
                type="button"
                onClick={() => onSelect?.(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default EmojiPicker;
