import { useEffect, useState } from "react";
import { Moon, Sun, Bell, BellOff, LogOut, Palette, Image, Trash2, X, Shield, FileText, HelpCircle, Info } from "lucide-react";
import { deleteCurrentUser } from "../services/userService";
import ConfirmModal from "./ConfirmModal";
import { useAuth } from "../context/AuthContext";
import OverlayPage from "./OverlayPage";
import { motion } from "framer-motion";

const THEME_COLORS = [
  { name: "Blue", value: "blue", hue: 214, label: "Telegram Blue" },
  { name: "Purple", value: "purple", hue: 290, label: "Telegram Purple" },
  { name: "Green", value: "green", hue: 152, label: "Telegram Green" },
  { name: "Red", value: "red", hue: 0, label: "Telegram Red" },
  { name: "Orange", value: "orange", hue: 33, label: "Telegram Orange" },
  { name: "Pink", value: "pink", hue: 338, label: "Telegram Pink" },
  { name: "Teal", value: "teal", hue: 175, label: "Deep Teal" },
  { name: "Rose", value: "rose", hue: 350, label: "Soft Rose" },
  { name: "Cyan", value: "cyan", hue: 190, label: "Neon Cyan" },
  { name: "Indigo", value: "indigo", hue: 240, label: "Royal Indigo" },
  { name: "Yellow", value: "yellow", hue: 48, label: "Sunny Yellow" },
  { name: "Amber", value: "amber", hue: 38, label: "Warm Amber" },
];

const BACKGROUND_DOODLES = [
  { name: "Light D", value: "light", label: "Light Doodle" },
  { name: "Dark D", value: "dark", label: "Dark Doodle" },
  { name: "Minimal", value: "minimal", label: "Minimal Pattern" },
  { name: "Wave", value: "wave", label: "Wave Pattern" },
  { name: "Midnight", value: "midnight", label: "Solid Midnight" },
  { name: "Obsidian", value: "obsidian", label: "Solid Obsidian" },
  { name: "Aura", value: "aura", label: "Aura Gradient" },
  { name: "Cosmos", value: "cosmos", label: "Cosmos Pattern" },
  { name: "Custom", value: "custom", label: "Custom Photo" },
];

function SettingsPanel({ 
  isOpen, 
  onClose, 
  theme, 
  onThemeToggle, 
  onLogout,
  backgroundDoodle = { type: "light", opacity: 0.3 },
  onBackgroundChange = () => {},
  isRouted = false
}) {
  const { token } = useAuth();
  const notifStatus =
    typeof Notification !== "undefined" ? Notification.permission : "denied";
  
  const [selectedColor, setSelectedColor] = useState(() => {
    const stored = typeof window !== "undefined" 
      ? window.localStorage.getItem("chat-color-theme") 
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
      alert("You are not signed in.");
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await deleteCurrentUser(token);
      alert("Your account has been deleted. You will be logged out.");
      setShowDeleteConfirm(false);
      onLogout();
    } catch (error) {
      alert(`Failed to delete account: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleColorChange = (color) => {
    setSelectedColor(color.value);
    const root = document.documentElement;
    root.classList.remove(...THEME_COLORS.map((c) => `theme-${c.value}`));
    root.classList.add(`theme-${color.value}`);
    
    if (typeof window !== "undefined") {
      window.localStorage.setItem("chat-color-theme", color.value);
    }
  };

  const handleBackgroundDoodleChange = (doodleType) => {
    if (doodleType === 'custom') {
      document.getElementById('custom-bg-upload').click();
    } else {
      onBackgroundChange(doodleType, backgroundDoodle.opacity);
    }
  };

  const handleCustomPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      onBackgroundChange('custom', backgroundDoodle.opacity, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleOpacityChange = (newOpacity) => {
    onBackgroundChange(backgroundDoodle.type, newOpacity, backgroundDoodle.customUrl);
  };

  if (!isOpen) return null;

  const innerContent = (
    <div className={`side-panel-content-wrapper ${isRouted ? 'is-routed' : ''}`}>
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
            <input 
              type="file" 
              id="custom-bg-upload" 
              hidden 
              accept="image/*" 
              onChange={handleCustomPhotoUpload} 
            />
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
                <div className={`chat-bg-preview chat-bg-doodle-${bg.value}${bg.value === 'custom' && backgroundDoodle.customUrl ? ' has-image' : ''}`}>
                  {bg.value === 'custom' ? (
                    backgroundDoodle.customUrl ? (
                      <img src={backgroundDoodle.customUrl} alt="Custom" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="chat-bg-custom-placeholder">
                        <Plus size={24} />
                      </div>
                    )
                  ) : null}
                </div>
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

        {/* Legal & About */}
        <div className="ios-list-group">
          <div className="settings-row" onClick={() => window.location.hash = "/settings/privacy"} style={{ cursor: 'pointer' }}>
            <div className="settings-row__info">
              <Shield size={22} />
              <div>
                <strong>Privacy Policy</strong>
                <p>How we protect your data</p>
              </div>
            </div>
          </div>
          
          <div className="settings-row" onClick={() => window.location.hash = "/settings/terms"} style={{ cursor: 'pointer' }}>
            <div className="settings-row__info">
              <FileText size={22} />
              <div>
                <strong>Terms of Service</strong>
                <p>Community guidelines</p>
              </div>
            </div>
          </div>

          <div className="settings-row" onClick={() => window.location.hash = "/settings/help"} style={{ cursor: 'pointer' }}>
            <div className="settings-row__info">
              <HelpCircle size={22} />
              <div>
                <strong>Help Center</strong>
                <p>Get assistance</p>
              </div>
            </div>
          </div>

          <div className="settings-row" onClick={() => window.location.hash = "/settings/about"} style={{ cursor: 'pointer', borderBottom: 'none' }}>
            <div className="settings-row__info">
              <Info size={22} />
              <div>
                <strong>About</strong>
                <p>App versions and info</p>
              </div>
            </div>
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
        <div className="ios-list-group" style={{ marginBottom: '120px' }}>
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
    </div>
  );

  return (
    <>
      {isRouted ? (
        innerContent
      ) : (
        <OverlayPage onClose={onClose}>
          {innerContent}
        </OverlayPage>
      )}
      
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

