import { useState, useRef, useEffect, useMemo } from "react";
import { X, Camera, Save, ArrowLeft, Edit, Trash2, Users, Plus, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/app";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";
import { getImageUrl, handleImageError } from "../utils/imageHelper";
import OverlayPage from "./OverlayPage";
import ConfirmModal from "./ConfirmModal";
import { fetchUsers } from "../services/userService";
import { addMembersToGroupApi, updateGroupSettingsApi } from "../services/messageService";

function ProfilePanel({ isOpen, onClose, editMode = false, isRouted = false, chat = null }) {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  const { emit } = useSocket();

  // For Personal Profile
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState("");
  
  // For Group Profile
  const [groupName, setGroupName] = useState("");
  const [groupAvatar, setGroupAvatar] = useState("");
  const [groupAccent, setGroupAccent] = useState("");
  const [anyoneCanAdd, setAnyoneCanAdd] = useState(true);
  const [participants, setParticipants] = useState([]);
  
  // Common states
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [availableContacts, setAvailableContacts] = useState([]);
  const fileInputRef = useRef(null);

  const isMe = !chat;
  const isGroup = chat?.isGroupChat;
  const isAdmin = isGroup && String(chat.groupAdmin) === String(user?.id || user?._id);
  const canModify = isMe || (isGroup && isAdmin);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setImageLoadError(false);
      if (isMe) {
        setUsername(user?.username ?? "");
        setProfilePic(user?.profilePic ?? "");
      } else {
        setGroupName(chat.name ?? "");
        setGroupAvatar(chat.avatar ?? "");
        setGroupAccent(chat.accent ?? "");
        setAnyoneCanAdd(chat.anyoneCanAdd ?? true);
        setParticipants(chat.participants || []);
      }
    }
  }, [isOpen, isMe, user, chat]);

  const initials = useMemo(() => {
    const nameToUse = isMe ? username : groupName;
    return (nameToUse || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?";
  }, [isMe, username, groupName]);

  const displayImage = getImageUrl(isMe ? profilePic : groupAvatar);

  const handleFileClick = () => {
    if (!canModify) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Max size is 5MB.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed.");
      const { fileUrl } = await uploadRes.json();
      const cacheBustedUrl = `${fileUrl}?v=${Date.now()}`;

      if (isMe) {
        const updateRes = await fetch(`${API_URL}/api/users/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ profilePic: cacheBustedUrl }),
        });
        if (!updateRes.ok) throw new Error("Failed to update profile.");
        const updatedUser = await updateRes.json();
        updateUser(updatedUser);
        setProfilePic(cacheBustedUrl);
        emit("profileUpdated", { userId: user.id, username: updatedUser.username, avatar: cacheBustedUrl });
      } else {
        await updateGroupSettingsApi(token, chat.id, { avatar: cacheBustedUrl });
        setGroupAvatar(cacheBustedUrl);
        // Refreshing local state would ideally be handled by a parent callback or socket
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (isMe) {
        const res = await fetch(`${API_URL}/api/users/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ username: username.trim() }),
        });
        if (!res.ok) throw new Error("Failed to save profile.");
        const updatedUser = await res.json();
        updateUser(updatedUser);
        emit("profileUpdated", { userId: user.id, username: updatedUser.username, avatar: updatedUser.profilePic });
      } else if (isAdmin) {
        await updateGroupSettingsApi(token, chat.id, { 
          name: groupName.trim(), 
          anyoneCanAdd,
          accent: groupAccent
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddMembers = async () => {
    setIsAddingMembers(true);
    try {
      const allUsers = await fetchUsers(token);
      const existingIds = new Set(participants.map(p => String(p._id)));
      setAvailableContacts(allUsers.filter(u => !existingIds.has(String(u.id || u._id))));
    } catch (err) {
      setError("Failed to load contacts.");
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await addMembersToGroupApi(token, chat.id, [userId]);
      // Locally update for instant feedback (server should also broadcast)
      setAvailableContacts(prev => prev.filter(u => String(u.id || u._id) !== String(userId)));
      // Note: Full group sync would be better through useChatController's socket listeners
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  const innerContent = (
    <div className={`side-panel-content-wrapper ${isRouted ? 'is-routed' : ''}`}>
      <div className="side-panel__header">
        <button className="icon-button header-close-btn" onClick={onClose}>
          {editMode || isAddingMembers ? <ArrowLeft size={24} /> : <X size={24} />}
        </button>
        <h2>{isAddingMembers ? "Add Members" : (isMe ? (editMode ? "Edit Profile" : "Profile") : "Chat Info")}</h2>
        {isMe && !editMode && (
          <button className="icon-button" onClick={() => isRouted ? navigate("/profile?edit=true") : (window.location.hash = "/profile/edit")}>
            <Edit size={20} />
          </button>
        )}
      </div>

      <div className="side-panel__body">
        {isAddingMembers ? (
          <div className="add-members-view">
            <ul className="ncm-contact-list">
              {availableContacts.map(u => (
                <li key={u.id} className="ncm-contact-item" style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="ncm-contact-info">
                    <span className="ncm-name">{u.username}</span>
                    <span className="ncm-email">{u.email}</span>
                  </div>
                  <button className="ncm-btn ncm-btn--primary" style={{ padding: '4px 12px', fontSize: 13 }} onClick={() => handleAddMember(u.id)}>Add</button>
                </li>
              ))}
              {availableContacts.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5, marginTop: 20 }}>No more members to add.</p>}
            </ul>
          </div>
        ) : (
          <>
            {/* Avatar Row */}
            <div className="profile-avatar-wrap" onClick={handleFileClick} style={{ cursor: canModify ? 'pointer' : 'default' }}>
              {displayImage && !imageLoadError ? (
                <img src={displayImage} alt="Avatar" className="profile-avatar-img" onError={() => setImageLoadError(true)} />
              ) : (
                <div className="profile-avatar-fallback" style={!isMe ? { background: groupAccent } : {}}>{initials}</div>
              )}
              {canModify && <div className="profile-avatar-edit"><Camera size={18} /></div>}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
            </div>

            {isMe ? (
              <div className="ios-list-group">
                <label className="profile-label">
                  <span>Username</span>
                  <input className="profile-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} readOnly={!editMode} />
                </label>
                <label className="profile-label" style={{ borderBottom: 'none' }}>
                  <span>Email</span>
                  <input className="profile-input profile-input--readonly" type="email" value={user?.email ?? ""} readOnly style={{ opacity: 0.6 }} />
                </label>
              </div>
            ) : isGroup ? (
              <>
                <div className="ios-list-group">
                  <label className="profile-label">
                    <span>Group Name</span>
                    <input className="profile-input" type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} readOnly={!isAdmin} />
                  </label>
                  {isAdmin && (
                    <div className="profile-label" style={{ borderBottom: 'none', justifyContent: 'space-between' }}>
                      <span>Anyone can add members</span>
                      <input type="checkbox" checked={anyoneCanAdd} onChange={(e) => setAnyoneCanAdd(e.target.checked)} />
                    </div>
                  )}
                </div>

                <div className="participants-section" style={{ marginTop: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Users size={18} /> Participants ({participants.length})
                    </h3>
                    {(isAdmin || anyoneCanAdd) && (
                      <button className="icon-button" style={{ color: 'var(--accent)' }} onClick={handleOpenAddMembers}>
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                  <ul className="participants-list" style={{ listStyle: 'none', padding: 0 }}>
                    {participants.map(p => (
                      <li key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                        <div className="p-avatar" style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                          {p.username?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 14 }}>{p.username}</span>
                          {String(p._id) === String(chat.groupAdmin) && <span style={{ marginLeft: 8, fontSize: 10, background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa', padding: '2px 6px', borderRadius: 4 }}>Admin</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="ios-list-group">
                <label className="profile-label">
                  <span>Contact Name</span>
                  <input className="profile-input" type="text" value={chat.name} readOnly />
                </label>
              </div>
            )}

            {error && <p className="profile-error">{error}</p>}

            <div style={{ marginTop: "20px" }}>
              {(editMode || (isGroup && isAdmin)) && (
                <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : saved ? "✓ Saved!" : <><Save size={20} /> Save Changes</>}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isRouted ? innerContent : <OverlayPage onClose={onClose}>{innerContent}</OverlayPage>}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Remove Photo"
        description="Are you sure you want to remove the photo?"
        actionLabel="Remove"
        onConfirm={() => {}} // TODO: Generic delete photo
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </>
  );
}

export default ProfilePanel;

