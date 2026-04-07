import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Camera, Save } from "lucide-react";
import { API_URL } from "../config/app";
import { useAuth } from "../context/AuthContext";
import { getImageUrl, handleImageError } from "../utils/imageHelper";

function ProfilePanel({ isOpen, onClose }) {
  const { user, token } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [profilePic, setProfilePic] = useState(user?.profilePic ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);
  const inputRef = useRef(null);

  const handleSave = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: username.trim(), profilePic: profilePic.trim() }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to save profile.");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const initials = (username || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

  const displayImage = getImageUrl(profilePic);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="profile-backdrop"
            className="side-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.aside
            key="profile-panel"
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
              <h2>Profile</h2>
            </div>

            <div className="side-panel__body">
              {/* Avatar preview */}
              <div className="profile-avatar-wrap">
                {displayImage && !imageLoadError ? (
                  <img
                    src={displayImage}
                    alt="Avatar"
                    className="profile-avatar-img"
                    onError={(e) => {
                      console.warn("❌ Avatar image failed to load:", displayImage);
                      setImageLoadError(true);
                      handleImageError(e);
                    }}
                  />
                ) : (
                  <div className="profile-avatar-fallback">{initials}</div>
                )}
                <button
                  className="profile-avatar-edit"
                  type="button"
                  title="Change avatar (paste URL below)"
                  onClick={() => inputRef.current?.focus()}
                >
                  <Camera size={18} />
                </button>
              </div>

              <div className="ios-list-group">
                <label className="profile-label">
                  <span>Username</span>
                  <input
                    className="profile-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={32}
                  />
                </label>

                <label className="profile-label">
                  <span>Avatar URL</span>
                  <input
                    ref={inputRef}
                    className="profile-input"
                    type="url"
                    placeholder="https://www.reddit.com/r/Instagram/comments/vf9w0q/profile_picture_changes_randomly_on_its_own/"
                    value={profilePic}
                    onChange={(e) => setProfilePic(e.target.value)}
                  />
                </label>

                <label className="profile-label" style={{ borderBottom: 'none' }}>
                  <span>Email</span>
                  <input
                    className="profile-input profile-input--readonly"
                    type="email"
                    value={user?.email ?? ""}
                    readOnly
                    style={{ opacity: 0.6 }}
                  />
                </label>
              </div>

              {error && <p className="profile-error">{error}</p>}

              <button
                className="profile-save-btn"
                type="button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : saved ? "✓ Saved!" : (
                  <><Save size={20} /> Save Profile</>
                )}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default ProfilePanel;
