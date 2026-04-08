/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from "framer-motion";
/* eslint-enable no-unused-vars */
import { useEffect, useState } from "react";
import { X, Moon, Sun, Bell, BellOff, LogOut, Palette, Image, Trash2 } from "lucide-react";
import { deleteCurrentUser } from "../services/userService";
import ConfirmModal from "./ConfirmModal";
import { useAuth } from "../context/AuthContext";

const THEME_COLORS = [
  { name: "Blue", value: "blue", hue: 214, label: "Telegram Blue" },
  { name: "Purple", value: "purple", hue: 290, label: "Telegram Purple" },
  { name: "Green", value: "green", hue: 152, label: "Telegram Green" },
  { name: "Red", value: "red", hue: 0, label: "Telegram Red" },
  { name: "Orange", value: "orange", hue: 33, label: "Telegram Orange" },
  { name: "Pink", value: "pink", hue: 338, label: "Telegram Pink" },
];

const BACKGROUND_DOODLES = [
  { name: "Light", value: "light", label: "Light Doodle" },
  { name: "Dark", value: "dark", label: "Dark Doodle" },
  { name: "Minimal", value: "minimal", label: "Minimal Pattern" },
  { name: "Wave", value: "wave", label: "Wave Pattern" },
];

function SettingsPanel({ 
  isOpen, 
  onClose, 
  theme, 
  onThemeToggle, 
  onLogout,
  backgroundDoodle = { type: "light", opacity: 0.3 },
  onBackgroundChange = () => {}
}) {
  const { token } = useAuth();
  const notifStatus =
    typeof Notification !== "undefined" ? Notification.permission : "denied";
  
  const [selectedColor, setSelectedColor] = useState(() => {
    const stored = typeof window !== "undefined" 
      ? window.sessionStorage.getItem("chat-color-theme") 
      : null;
    return stored || "blue";
  });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const requestNotifPermission = () => {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission();
  };

  const handleDeleteAccount = async () => {
    if (!token) {
      console.error("❌ Delete account: No token available");
      alert("You are not signed in.");
      return;
    }
    
    setIsDeleting(true);
    console.log("🔄 Attempting to delete account...");
    
    try {
      const response = await deleteCurrentUser(token);
      console.log("✅ Account deleted successfully:", response);
      alert("Your account has been deleted. You will be logged out.");
      setShowDeleteConfirm(false);
      onLogout();
    } catch (error) {
      console.error("❌ Failed to delete account:", error);
      alert(`Failed to delete account: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleColorChange = (color) => {
    setSelectedColor(color.value);
    // Apply theme to root element
    const root = document.documentElement;
    root.classList.remove(...THEME_COLORS.map((c) => `theme-${c.value}`));
    root.classList.add(`theme-${color.value}`);
    
    // Store preference
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("chat-color-theme", color.value);
    }
  };

  const handleBackgroundDoodleChange = (doodleType) => {
    onBackgroundChange(doodleType, backgroundDoodle.opacity);
  };

  const handleOpacityChange = (newOpacity) => {
    onBackgroundChange(backgroundDoodle.type, newOpacity);
  };

  // Manage body scroll when settings panel opens/closes
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="settings-backdrop"
              className="side-panel-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              key="settings-panel"
              className="side-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="side-panel__header">
                <button className="icon-button header-close-btn" type="button" onClick={onClose} aria-label="Close">
                  <X size={24} />
                </button>
                <h2>Settings</h2>
              </div>

              <div className="side-panel__body">
              {/* Appearance Theme */}
              <div className="ios-list-group">
                <div className="settings-row">
                  <div className="settings-row__info">
                    {theme === "dark" ? <Moon size={22} /> : <Sun size={22} />}
                    <div>
                      <strong>Appearance</strong>
                      <p>{theme === "dark" ? "Dark mode" : "Light mode"}</p>
                    </div>
                  </div>
                  <button
                    className="settings-toggle"
                    type="button"
                    onClick={onThemeToggle}
                    aria-label="Toggle theme"
                  >
                    <span className={`settings-toggle__track ${theme === "dark" ? "is-active" : ""}`}>
                      <span className="settings-toggle__thumb" />
                    </span>
                  </button>
                </div>

                {/* Color Theme */}
                <div className="settings-row settings-row--expanded">
                  <div className="settings-row__info">
                    <Palette size={22} />
                    <div>
                      <strong>Chat Color</strong>
                      <p>Customize accent color</p>
                    </div>
                  </div>
                </div>
                <div className="theme-color-picker">
                  {THEME_COLORS.map((color) => (
                    <motion.button
                      key={color.value}
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleColorChange(color)}
                      className={`theme-color-option ${selectedColor === color.value ? "is-active" : ""}`}
                      style={{
                        backgroundColor: `hsl(${color.hue}, 100%, 56%)`,
                        boxShadow: selectedColor === color.value 
                          ? `0 0 0 2.5px var(--surface), 0 0 0 4.5px hsl(${color.hue}, 100%, 56%)`
                          : "none"
                      }}
                      title={color.label}
                      aria-label={`Select ${color.label}`}
                    />
                  ))}
                </div>
              </div>

              {/* Chat Background */}
              <div className="ios-list-group">
                <div className="settings-row settings-row--expanded">
                  <div className="settings-row__info">
                    <Image size={22} />
                    <div>
                      <strong>Chat Background</strong>
                      <p>Choose doodle pattern</p>
                    </div>
                  </div>
                </div>
                <div className="chat-bg-selector">
                  {BACKGROUND_DOODLES.map((bg) => (
                    <motion.button
                      key={bg.value}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleBackgroundDoodleChange(bg.value)}
                      className={`chat-bg-option ${backgroundDoodle.type === bg.value ? "is-active" : ""}`}
                      title={bg.label}
                      aria-label={`Select ${bg.label}`}
                    >
                      <div className={`chat-bg-preview chat-bg-doodle-${bg.value}`} />
                      <span>{bg.name}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Transparency Control */}
                <div className="settings-row settings-row--expanded">
                  <div className="settings-row__info">
                    <div>
                      <strong>Background Transparency</strong>
                      <p>{Math.round(backgroundDoodle.opacity * 100)}% opacity</p>
                    </div>
                  </div>
                </div>
                <div className="opacity-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={backgroundDoodle.opacity}
                    onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                    className="opacity-slider"
                    aria-label="Background opacity"
                  />
                  <div className="opacity-labels">
                    <span>Transparent</span>
                    <span>Opaque</span>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="ios-list-group">
                <div className="settings-row">
                  <div className="settings-row__info">
                    {notifStatus === "granted" ? <Bell size={22} /> : <BellOff size={22} />}
                    <div>
                      <strong>Notifications</strong>
                      <p>
                        {notifStatus === "granted"
                          ? "Enabled"
                          : notifStatus === "denied"
                          ? "Blocked by browser"
                          : "Not enabled"}
                      </p>
                    </div>
                  </div>
                  {notifStatus !== "denied" && (
                    <button
                      className="settings-btn"
                      type="button"
                      onClick={requestNotifPermission}
                      disabled={notifStatus === "granted"}
                    >
                      {notifStatus === "granted" ? "On" : "Enable"}
                    </button>
                  )}
                </div>
              </div>

              {/* Logout */}
              <div className="ios-list-group">
                <div className="settings-row settings-row--danger">
                  <div className="settings-row__info">
                    <LogOut size={22} />
                    <div>
                      <strong>Logout</strong>
                      <p>Sign out of your account</p>
                    </div>
                  </div>
                  <button className="settings-btn settings-btn--danger" type="button" onClick={onLogout}>
                    Log Out
                  </button>
                </div>
              </div>

              {/* Delete Account */}
              <div className="ios-list-group">
                <div className="settings-row settings-row--danger">
                  <div className="settings-row__info">
                    <Trash2 size={22} />
                    <div>
                      <strong>Delete Account</strong>
                      <p>Permanently delete your account</p>
                    </div>
                  </div>
                  <button 
                    className="settings-btn settings-btn--danger" 
                    type="button" 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
    
    <ConfirmModal
      isOpen={showDeleteConfirm}
      title="Delete Account"
      description="Are you sure you want to permanently delete your account? This action cannot be undone. All your chats and messages will be deleted."
      actionLabel="Delete Account"
      onConfirm={handleDeleteAccount}
      onCancel={() => setShowDeleteConfirm(false)}
    />
    </>
  );
}

export default SettingsPanel;
