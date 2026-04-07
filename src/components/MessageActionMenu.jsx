import {AnimatePresence } from "framer-motion";
import { Copy, Trash2, Forward, Reply, Pin, X } from "lucide-react";

function MessageActionMenu({
  isOpen,
  onClose,
  onCopy,
  onDelete,
  onForward,
  onReply,
  onPin,
  isPinned,
  isDeleted,
  isMobile,
}) {
  if (!isOpen) return null;

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="message-action-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 3999,
              }}
            />

            {/* Bottom Sheet */}
            <motion.div
              className="message-action-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 4000,
              }}
            >
              <div className="message-action-sheet__handle" />
              <div className="message-action-sheet__content">
                {!isDeleted && (
                  <button
                    type="button"
                    className="message-action-sheet__item"
                    onClick={() => {
                      onReply();
                      onClose();
                    }}
                  >
                    <Reply size={20} />
                    <span>Reply</span>
                  </button>
                )}

                {!isDeleted && (
                  <button
                    type="button"
                    className="message-action-sheet__item"
                    onClick={() => {
                      onForward();
                      onClose();
                    }}
                  >
                    <Forward size={20} />
                    <span>Forward</span>
                  </button>
                )}

                {!isDeleted && (
                  <button
                    type="button"
                    className="message-action-sheet__item"
                    onClick={() => {
                      onCopy();
                      onClose();
                    }}
                  >
                    <Copy size={20} />
                    <span>Copy</span>
                  </button>
                )}

                {!isDeleted && onPin && (
                  <button
                    type="button"
                    className="message-action-sheet__item"
                    onClick={() => {
                      onPin();
                      onClose();
                    }}
                  >
                    <Pin size={20} />
                    <span>{isPinned ? "Unpin" : "Pin"}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="message-action-sheet__item message-action-sheet__item--danger"
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                >
                  <Trash2 size={20} />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  className="message-action-sheet__item message-action-sheet__item--cancel"
                  onClick={onClose}
                >
                  <X size={20} />
                  <span>Cancel</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop floating menu (already handled by MessageMenu)
  return null;
}

export default MessageActionMenu;
