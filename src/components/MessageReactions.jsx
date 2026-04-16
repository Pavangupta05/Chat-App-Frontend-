import { useState, useCallback, useEffect, useLayoutEffect, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Reply, Copy, Image as ImageIcon, Link, Download, 
  Forward, CheckSquare, Pin, Trash2, Flag, Clock 
} from "lucide-react";

/**
 * MessageReactions Component
 * Final iOS Polish - Zero Flicker & High Smoothness
 */
const REACTION_EMOJIS = ["❤️", "👍", "🔥", "😂", "👏", "😱", "⚡"];

const MenuBtn = memo(({ icon: Icon, label, onClick, danger }) => (
  <motion.button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick?.(e);
    }}
    whileHover={{ backgroundColor: "rgba(128,128,128,0.12)" }}
    whileTap={{ scale: 0.98, backgroundColor: "rgba(128,128,128,0.18)" }}
    style={{
      display: "flex", alignItems: "center", gap: 14, padding: "10px 16px",
      width: "100%", border: "none", background: "transparent",
      color: danger ? "#ff453a" : "var(--text-primary)", fontSize: 15,
      fontWeight: 500, cursor: "pointer", textAlign: "left", outline: "none"
    }}
  >
    <Icon size={18} />
    <span>{label}</span>
  </motion.button>
));

export default function MessageReactions({
  isOutgoing,
  message,
  menuOpen,
  triggerRect,
  onCloseMenu,
  onReply,
  onForward,
  onSelect,
  onDeleteForMe,
  onDeleteForEveryone,
  onPin,
  children
}) {
  const [reactions, setReactions] = useState({});
  const [myReaction, setMyReaction] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [menuPos, setMenuPos] = useState({ 
    top: undefined, bottom: undefined, left: undefined, right: undefined,
    rectTop: 0, rectLeft: 0, width: 0, height: 0, alignBottom: false 
  });

  const IOS_SPRING = { type: "spring", stiffness: 450, damping: 32, mass: 1 };
  
  const handleClose = useCallback(() => {
    onCloseMenu();
  }, [onCloseMenu]);

  // Haptics
  const triggerHaptic = (intensity = 10) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(intensity);
    }
  };

  // Sync state before paint to avoid flickering
  useLayoutEffect(() => {
    if (menuOpen && triggerRect) {
      const rect = triggerRect;
      const isNearBottom = window.innerHeight - rect.bottom < 320;
      const isNearRight = window.innerWidth - rect.right < 280;
      const isNearLeft = rect.left < 280;
      const hPadding = 16;

      setMenuPos({
        top: isNearBottom ? undefined : rect.bottom + 8,
        bottom: isNearBottom ? window.innerHeight - rect.top + 8 : undefined,
        left: isOutgoing ? undefined : (isNearLeft ? hPadding : rect.left),
        right: isOutgoing ? (isNearRight ? hPadding : window.innerWidth - rect.right) : undefined,
        rectTop: rect.top,
        rectLeft: rect.left,
        width: rect.width || 0,
        height: rect.height || 0,
        alignBottom: isNearBottom
      });
      
      setIsReady(true);
      triggerHaptic(12);
    } else {
      setIsReady(false);
    }
  }, [menuOpen, triggerRect, isOutgoing]);

  // Auto-close on interactions (with a small guard delay)
  useEffect(() => {
    if (!menuOpen || !isReady) return;
    
    // Ignore immediate scroll events right after opening
    const startTime = Date.now();
    const closer = () => {
      if (Date.now() - startTime > 100) handleClose();
    };

    window.addEventListener("scroll", closer, true);
    window.addEventListener('resize', closer);
    return () => {
      window.removeEventListener("scroll", closer, true);
      window.removeEventListener('resize', closer);
    };
  }, [menuOpen, isReady, handleClose]);

  const handleReact = useCallback((emoji) => {
    triggerHaptic(10);
    setReactions(prev => {
      const next = { ...prev };
      if (myReaction) {
        next[myReaction] = Math.max(0, (next[myReaction] || 1) - 1);
        if (next[myReaction] === 0) delete next[myReaction];
      }
      if (myReaction === emoji) setMyReaction(null);
      else {
        next[emoji] = (next[emoji] || 0) + 1;
        setMyReaction(emoji);
      }
      return next;
    });
    handleClose();
  }, [myReaction, handleClose]);

  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <div className="reaction-wrapper" style={{ position: "relative" }}>
      {/* 
        Opacity management for zero-gap transition.
        The wrapper stays in flow to hold the height.
      */}
      <div style={{ opacity: (menuOpen && isReady) ? 0 : 1 }}>
        {children}
      </div>

      {createPortal(
        <AnimatePresence mode="wait">
          {menuOpen && isReady && (
            <div className="portal-overlay-root" style={{ position: "fixed", inset: 0, zIndex: 100000 }}>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)"
                }}
              />

              {/* Transitioned Child (Pop-out effect) */}
              <motion.div
                initial={{ 
                  scale: 0.98,
                  top: menuPos.rectTop, 
                  left: menuPos.rectLeft,
                }}
                animate={{ scale: 1.04 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={IOS_SPRING}
                style={{
                  position: "fixed",
                  width: menuPos.width,
                  height: menuPos.height,
                  pointerEvents: "none", zIndex: 2,
                  transformOrigin: isOutgoing ? "right center" : "left center"
                }}
              >
                {children}
              </motion.div>

              {/* Menu UI */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: menuPos.alignBottom ? 20 : -20, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)", transition: { duration: 0.12 } }}
                transition={{ ...IOS_SPRING, staggerChildren: 0.04 }}
                style={{
                  position: "fixed",
                  top: menuPos.top,
                  bottom: menuPos.bottom,
                  left: menuPos.left,
                  right: menuPos.right,
                  display: "flex",
                  flexDirection: menuPos.alignBottom ? "column-reverse" : "column",
                  alignItems: isOutgoing ? "flex-end" : "flex-start",
                  gap: 12, zIndex: 3
                }}
              >
                {/* Emoji Bar */}
                <div style={{
                  background: "rgba(35, 35, 35, 0.96)",
                  backdropFilter: "blur(30px)",
                  WebkitBackdropFilter: "blur(30px)",
                  borderRadius: 30, padding: "8px 12px",
                  display: "flex", gap: 14,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}>
                  {REACTION_EMOJIS.map(emoji => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.35, y: -6 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={(e) => { e.stopPropagation(); handleReact(emoji); }}
                      style={{
                        background: "none", border: "none", fontSize: 26, cursor: "pointer",
                        filter: myReaction === emoji ? "drop-shadow(0 0 6px #fff)" : "none",
                        outline: "none"
                      }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>

                {/* Actions List */}
                <div style={{
                  background: "rgba(35, 35, 35, 0.96)",
                  backdropFilter: "blur(30px)",
                  WebkitBackdropFilter: "blur(30px)",
                  borderRadius: 20, width: 260,
                  overflow: "hidden",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "6px 0"
                }}>
                  <MenuBtn icon={Reply} label="Reply" onClick={onReply} />
                  {message.text && (
                    <MenuBtn 
                      icon={Copy} label="Copy Text" 
                      onClick={() => { triggerHaptic(5); navigator.clipboard.writeText(message.text); handleClose(); }} 
                    />
                  )}
                  <MenuBtn icon={Forward} label="Forward" onClick={onForward} />
                  <MenuBtn icon={Pin} label="Pin" onClick={onPin} />
                  <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
                  <MenuBtn icon={Trash2} label="Delete" danger onClick={onDeleteForMe} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Inline Reactions */}
      <AnimatePresence>
        {hasReactions && !menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={IOS_SPRING}
            style={{
              display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4,
              justifyContent: isOutgoing ? "flex-end" : "flex-start"
            }}
          >
            {Object.entries(reactions).map(([emoji, count]) => (
              <motion.div key={emoji} layout style={{
                background: "var(--surface-alt)", border: "1px solid var(--border-color)",
                borderRadius: 14, padding: "3px 8px", fontSize: 13,
                display: "flex", alignItems: "center", gap: 5,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
              }}>
                <span>{emoji}</span>
                {count > 1 && <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>{count}</span>}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
