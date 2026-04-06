import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Sun, Bell, BellOff, LogOut } from "lucide-react";

function SettingsPanel({ isOpen, onClose, theme, onThemeToggle, onLogout }) {
  const notifStatus =
    typeof Notification !== "undefined" ? Notification.permission : "denied";

  const requestNotifPermission = () => {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission();
  };

  return (
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
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
          >
            <div className="side-panel__header">
              <h2>Settings</h2>
              <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="side-panel__body">
              {/* Dark Mode */}
              <div className="settings-row">
                <div className="settings-row__info">
                  {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
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

              {/* Notifications */}
              <div className="settings-row">
                <div className="settings-row__info">
                  {notifStatus === "granted" ? <Bell size={20} /> : <BellOff size={20} />}
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

              {/* Logout */}
              <div className="settings-row settings-row--danger">
                <div className="settings-row__info">
                  <LogOut size={20} />
                  <div>
                    <strong>Logout</strong>
                    <p>Sign out of your account</p>
                  </div>
                </div>
                <button className="settings-btn settings-btn--danger" type="button" onClick={onLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default SettingsPanel;
