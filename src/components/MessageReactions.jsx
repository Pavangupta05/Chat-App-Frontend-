import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const REACTION_EMOJIS = ["❤️", "👍", "👎", "😂", "🔥", "😱"];

/**
 * MessageReactions
 * - Desktop: hover triggers picker
 * - Mobile: longPressActive (from MessageBubble) triggers picker
 * - Picker appears with staggered spring-bounce emoji animation
 * - Badges animate in below the bubble on react
 */
function MessageReactions({ isOutgoing, longPressActive, onDismissLongPress, children }) {
  const [reactions, setReactions] = useState({});   // { emoji: count }
  const [myReaction, setMyReaction] = useState(null);
  const [hoverOpen, setHoverOpen] = useState(false);
  const hideTimer = useRef(null);

  const startHide = () => { hideTimer.current = setTimeout(() => setHoverOpen(false), 600); };
  const cancelHide = () => clearTimeout(hideTimer.current);

  const isPickerVisible = hoverOpen || longPressActive;

  const handleReact = useCallback((emoji) => {
    setReactions((prev) => {
      const next = { ...prev };
      // remove old reaction
      if (myReaction && myReaction !== emoji) {
        next[myReaction] = Math.max(0, (next[myReaction] || 0) - 1);
        if (next[myReaction] === 0) delete next[myReaction];
      }
      // toggle
      if (myReaction === emoji) {
        next[emoji] = Math.max(0, (next[emoji] || 0) - 1);
        if (next[emoji] === 0) delete next[emoji];
        setMyReaction(null);
      } else {
        next[emoji] = (next[emoji] || 0) + 1;
        setMyReaction(emoji);
      }
      return next;
    });
    setHoverOpen(false);
    onDismissLongPress?.();
  }, [myReaction, onDismissLongPress]);

  const hasReactions = Object.keys(reactions).length > 0;

  /* Picker animation variants */
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.6, y: 10 },
    visible: {
      opacity: 1, scale: 1, y: 0,
      transition: { type: "spring", stiffness: 400, damping: 25, staggerChildren: 0.04 },
    },
    exit: { opacity: 0, scale: 0.6, y: 10, transition: { duration: 0.15 } },
  };

  const emojiVariants = {
    hidden: { opacity: 0, scale: 0.4, y: 8 },
    visible: {
      opacity: 1, scale: 1, y: 0,
      transition: { type: "spring", stiffness: 450, damping: 22 },
    },
  };

  return (
    <div
      className={`reaction-wrap ${isOutgoing ? "reaction-wrap--out" : "reaction-wrap--in"}`}
      onMouseEnter={() => { cancelHide(); setHoverOpen(true); }}
      onMouseLeave={startHide}
    >
      {/* Actual message bubble rendered here */}
      {children}

      {/* ── Emoji Picker popup (animated) ──────────────────────────── */}
      <AnimatePresence>
        {isPickerVisible && (
          <motion.div
            className={`reaction-picker ${isOutgoing ? "reaction-picker--out" : "reaction-picker--in"}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onMouseEnter={cancelHide}
            onMouseLeave={startHide}
            onClick={(e) => e.stopPropagation()}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                type="button"
                className={`reaction-picker__emoji ${myReaction === emoji ? "is-selected" : ""}`}
                variants={emojiVariants}
                whileHover={{ scale: 1.35, y: -4 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                onClick={() => handleReact(emoji)}
                title={emoji}
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reaction badge row under bubble ───────────────────────── */}
      <AnimatePresence>
        {hasReactions && (
          <motion.div
            className={`reaction-badges ${isOutgoing ? "reaction-badges--out" : ""}`}
            initial={{ opacity: 0, y: 4, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 500, damping: 26 }}
          >
            {Object.entries(reactions).map(([emoji, count]) => (
              <motion.button
                key={emoji}
                type="button"
                layout
                className={`reaction-badge ${myReaction === emoji ? "reaction-badge--mine" : ""}`}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReact(emoji)}
              >
                <span className="reaction-badge__emoji">{emoji}</span>
                {count > 1 && <span className="reaction-badge__count">{count}</span>}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MessageReactions;
