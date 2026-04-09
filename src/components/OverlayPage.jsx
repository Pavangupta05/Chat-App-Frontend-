import React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";

/**
 * OverlayPage - A Telegram-style sliding panel.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content of the panel
 * @param {string} props.className - Custom class for the panel
 * @param {() => void} props.onClose - Callback when panel is closed via swipe or button
 * @param {boolean} props.showBackdrop - Whether to show the dimming background
 */
const OverlayPage = ({ 
  children, 
  className = "", 
  onClose,
  showBackdrop = true
}) => {
  const navigate = useNavigate();
  const x = useMotionValue(0);
  
  // Map drag distance to backdrop opacity and scale of the background (optional)
  const opacity = useTransform(x, [0, 150], [1, 0]);
  
  const handleDragEnd = (event, info) => {
    // If dragged more than 100px to the right, or flicked with high velocity
    if (info.offset.x > 100 || info.velocity.x > 500) {
      if (onClose) {
        onClose();
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <>
      {showBackdrop && (
        <motion.div
          className="side-panel-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ opacity }}
          onClick={() => (onClose ? onClose() : navigate(-1))}
        />
      )}
      <motion.aside
        className={`side-panel ${className}`}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 200,
          mass: 0.8
        }}
        drag="x"
        dragConstraints={{ left: 0, right: window.innerWidth }}
        dragElastic={0.05}
        style={{ x }}
        onDragEnd={handleDragEnd}
      >
        <div className="side-panel__drag-handle" aria-hidden="true" />
        {children}
      </motion.aside>
    </>
  );
};

export default OverlayPage;
