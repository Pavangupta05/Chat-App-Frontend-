import { useState, useRef } from "react";
import { X, Camera, Save, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { API_URL } from "../config/app";
import { useAuth } from "../context/AuthContext";
import { getImageUrl, handleImageError } from "../utils/imageHelper";
import OverlayPage from "./OverlayPage";
import ConfirmModal from "./ConfirmModal";

function ProfilePanel({ isOpen, onClose, editMode = false }) {
  const { user, token } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [profilePic, setProfilePic] = useState(user?.profilePic ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const handleDeletePhoto = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profilePic: "" }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete profile photo.");
      }
      setProfilePic("");
      setShowDeleteConfirm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("File is too large. Max size is 5MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // 2. Local Preview (URL.createObjectURL)
    const previewUrl = URL.createObjectURL(file);
    setProfilePic(previewUrl); 
    setError("");

    // 3. Upload to server
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadJson = await uploadRes.json();
        throw new Error(uploadJson.error || "Upload failed.");
      }

      const { fileUrl } = await uploadRes.json();
      
      // 4. Update Profile in DB
      // We append a timestamp to the URL for cache busting
      const cacheBustedUrl = `${fileUrl}?v=${new Date().getTime()}`;
      
      const updateRes = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profilePic: cacheBustedUrl }),
      });

      if (!updateRes.ok) {
        const updateJson = await updateRes.json();
        throw new Error(updateJson.error || "Failed to update profile info.");
      }

      setProfilePic(cacheBustedUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("[Profile Update Error]", err);
      setError(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

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

  if (!isOpen) return null;

  return (
    <OverlayPage onClose={onClose}>
      <div className="side-panel__header">
        <button className="icon-button header-close-btn" type="button" onClick={onClose} aria-label="Close">
          {editMode ? <ArrowLeft size={24} /> : <X size={24} />}
        </button>
        <h2>{editMode ? "Edit Profile" : "Profile"}</h2>
        {!editMode && (
          <button 
            className="icon-button" 
            type="button" 
            onClick={() => {
              // Redirect to edit route if it exists, or just set a local state
              // For now, since we are in ProfilePanel, let's just make it look right
              window.location.hash = "/profile/edit"; 
            }}
          >
            <Edit size={20} />
          </button>
        )}
      </div>

      <div className="side-panel__body">
        {/* Avatar preview */}
        <div className="profile-avatar-wrap" onClick={handleFileClick} style={{ cursor: 'pointer' }}>
          {displayImage && !imageLoadError ? (
            <img
              src={displayImage}
              alt="Avatar"
              className="profile-avatar-img"
              onError={(e) => {
                setImageLoadError(true);
                handleImageError(e);
              }}
            />
          ) : (
            <div className="profile-avatar-fallback">{initials}</div>
          )}
          
          <div className="profile-avatar-edit">
            <Camera size={18} />
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept="image/*"
          />
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
              readOnly={!editMode}
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

        <div style={{ marginTop: "20px" }}>
          {editMode && (
            <button
              className="profile-save-btn"
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : saved ? "✓ Saved!" : (
                <><Save size={20} /> Save Changes</>
              )}
            </button>
          )}
          
          {profilePic && (
            <button
              className="profile-save-btn"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving}
              style={{ 
                marginTop: "12px", 
                backgroundColor: "transparent", 
                color: "var(--danger)",
                border: "1px solid var(--danger)"
              }}
            >
              <Trash2 size={20} /> Remove Photo
            </button>
          )}
        </div>
        
        {!editMode && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Swipe right to return to chats
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Remove Profile Photo"
        description="Are you sure you want to remove your profile photo? It will be replaced by your initials."
        actionLabel="Remove"
        onConfirm={handleDeletePhoto}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </OverlayPage>
  );
}

export default ProfilePanel;
