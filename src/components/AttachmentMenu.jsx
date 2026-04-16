import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Image as ImageIcon, 
  Camera, 
  Headphones, 
  User, 
  BarChart2, 
  Calendar, 
  Smile,
  MapPin,
  X
} from "lucide-react";
import { useEffect, useRef } from "react";

const ATTACHMENT_OPTIONS = [
  { id: 'document', label: 'Document', icon: FileText, color: '#7c4dff' },
  { id: 'media', label: 'Photos & videos', icon: ImageIcon, color: '#2196f3' },
  { id: 'camera', label: 'Camera', icon: Camera, color: '#ff4081' },
  { id: 'audio', label: 'Audio', icon: Headphones, color: '#f44336' },
  { id: 'location', label: 'Location', icon: MapPin, color: '#4caf50' },
  { id: 'contact', label: 'Contact', icon: User, color: '#03a9f4' },
  { id: 'poll', label: 'Poll', icon: BarChart2, color: '#ffc107' },
  { id: 'event', label: 'Event', icon: Calendar, color: '#e91e63' },
  { id: 'sticker', label: 'New sticker', icon: Smile, color: '#00cc99' },
];

export default function AttachmentMenu({ isOpen, onClose, onSelect, isMobile }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.8,
      originX: 0.5,
      originY: 1
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 400,
        staggerChildren: 0.05
      }
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.8,
      transition: { duration: 0.2, ease: "easeOut" } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          className="attachment-menu"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: "absolute",
            bottom: "calc(100% + 15px)",
            left: isMobile ? "10px" : "auto",
            right: isMobile ? "10px" : "0",
            background: "var(--surface)",
            borderRadius: "20px",
            padding: "8px",
            boxShadow: "var(--shadow-menu)",
            border: "1px solid var(--border-color)",
            zIndex: 1000,
            width: isMobile ? "calc(100vw - 20px)" : "280px",
            overflow: "hidden"
          }}
        >
          <div className="attachment-menu__content">
            {ATTACHMENT_OPTIONS.map((option) => (
              <motion.button
                key={option.id}
                variants={itemVariants}
                className="attachment-menu__item"
                onClick={() => {
                  onSelect(option.id);
                  onClose();
                }}
                whileHover={{ backgroundColor: "var(--surface-hover)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "transparent",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  borderRadius: "12px",
                  textAlign: "left",
                  fontSize: "15px",
                  fontWeight: "500"
                }}
              >
                <div 
                  className="attachment-menu__icon-wrapper"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: option.color
                  }}
                >
                  <option.icon size={22} />
                </div>
                <span>{option.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
