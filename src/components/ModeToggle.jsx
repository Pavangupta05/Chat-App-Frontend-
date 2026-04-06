import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Users } from "lucide-react";

const ModeToggle = ({ mode, onToggle }) => {
  return (
    <div className="mode-toggle-container">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`mode-toggle-btn ${mode === "chats" ? "is-active" : ""}`}
        onClick={() => onToggle("chats")}
        title="Chats"
      >
        <MessageSquare size={18} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`mode-toggle-btn ${mode === "contacts" ? "is-active" : ""}`}
        onClick={() => onToggle("contacts")}
        title="Contacts"
      >
        <Users size={18} />
      </motion.button>
      
      {/* Background slide indicator */}
      <motion.div 
        className="mode-toggle-slider"
        animate={{ x: mode === "chats" ? 0 : 40 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </div>
  );
};

export default ModeToggle;
