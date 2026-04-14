import { motion, AnimatePresence } from "framer-motion";

function ConfirmModal({ actionLabel, description, isOpen, onCancel, onConfirm, title }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-backdrop" 
          role="dialog" 
          aria-modal="true" 
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="modal-card modal-card--confirm"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="modal-card__header">
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>

            <div className="modal-card__actions">
              <motion.button 
                whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }} 
                whileTap={{ scale: 0.95 }} 
                className="modal-card__ghost" 
                type="button" 
                onClick={onCancel}
              >
                Cancel
              </motion.button>
              <motion.button 
                whileHover={{ filter: "brightness(1.1)" }} 
                whileTap={{ scale: 0.95 }} 
                className="modal-card__danger" 
                type="button" 
                onClick={onConfirm}
              >
                {actionLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmModal;
