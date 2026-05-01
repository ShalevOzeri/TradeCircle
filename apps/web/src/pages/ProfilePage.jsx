import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getUser, getUserPosts, updateProfile, sendFriendRequest, acceptFriendRequest, deletePost, updatePost } from "../services/api";
import { useAuth } from "../context/AuthContext";
import MarketMentionChips from "../components/MarketMentionChips";

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
}

function ProfileCanvas({ name, username }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#4a6cf7");
    grad.addColorStop(1, "#a78bfa");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Decorative circles
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#fff";
    [[W * 0.85, H * 0.2, 80], [W * 0.1, H * 0.8, 60], [W * 0.5, H * 1.1, 100]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Name
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px Inter, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 30, H / 2 - 12);

    // Username
    ctx.font = "16px Inter, system-ui, sans-serif";
    ctx.globalAlpha = 0.8;
    ctx.fillText("@" + username, 30, H / 2 + 18);
    ctx.globalAlpha = 1;
  }, [name, username]);

  return <canvas ref={canvasRef} width={680} height={120} style={{ width: "100%", borderRadius: "12px 12px 0 0", display: "block" }} />;
}

export default function ProfilePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user: me, loginUser } = useAuth();
  const isOwnProfile = !id || id === me._id;
  const targetId = id || me._id;

  const [profile, setProfile]   = useState(null);
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editErr, setEditErr]   = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState("");

  const load = () => {
    getUser(targetId).done(res => setProfile(res.user)).fail(() => {});
    getUserPosts(targetId).done(res => setPosts(res.posts)).fail(() => setPosts([]));
  };

  useEffect(() => {
    Promise.all([
      new Promise(r => getUser(targetId).done(res => { setProfile(res.user); r(); }).fail(r)),
      new Promise(r => getUserPosts(targetId).done(res => { setPosts(res.posts); r(); }).fail(r))
    ]).then(() => setLoading(false));
  }, [targetId]);

  if (loading) return <div className="page-container"><p>Loading…</p></div>;
  if (!profile) return <div className="page-container"><p>User not found.</p></div>;

  const isFriend = profile.friends?.some(f => (f._id || f).toString() === me._id);
  const hasPendingRequest = me.friendRequests?.some(r => (r._id || r).toString() === profile._id);

  const onSaveProfile = () => {
    setEditErr("");
    updateProfile(me._id, editForm)
      .done(res => {
        setProfile(res.user);
        setEditing(false);
        const token = localStorage.getItem("token");
        loginUser(token, { ...me, ...editForm });
      })
      .fail(xhr => setEditErr(xhr.responseJSON?.message || "Update failed"));
  };

  const onAddFriend = () => sendFriendRequest(profile._id).done(() => alert("Friend request sent!")).fail(xhr => alert(xhr.responseJSON?.message));
  const onAccept = () => acceptFriendRequest(profile._id).done(load).fail(xhr => alert(xhr.responseJSON?.message));

  const onDeletePost = (postId) => {
    if (!window.confirm("Delete this post?")) return;
    deletePost(postId).done(() => setPosts(posts.filter(p => p._id !== postId))).fail(xhr => alert(xhr.responseJSON?.message));
  };

  const onSavePost = (postId) => {
    updatePost(postId, { content: editPostContent })
      .done(res => { setPosts(posts.map(p => p._id === postId ? res.post : p)); setEditingPost(null); })
      .fail(xhr => alert(xhr.responseJSON?.message));
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 12 }}>
        <button className="btn-ghost" onClick={() => nav(-1)}>Back</button>
      </div>
      {/* Profile card with canvas banner */}
      <div className="card" style={{ padding: 0, marginBottom: 20, overflow: "hidden" }}>
        <ProfileCanvas name={profile.fullName} username={profile.username} />
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ marginBottom: 2 }}>{profile.fullName}</h2>
              <div style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: 6 }}>@{profile.username}</div>
              {profile.bio && <p style={{ fontSize: "0.9rem", color: "var(--text)", marginBottom: 8 }}>{profile.bio}</p>}
              <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                {profile.friends?.length || 0} friends · Member since {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {isOwnProfile ? (
                <button className="btn-ghost" onClick={() => { setEditing(!editing); setEditForm({ fullName: profile.fullName, bio: profile.bio || "" }); }}>
                  {editing ? "Cancel" : "Edit Profile"}
                </button>
              ) : (
                <>
                  {!isFriend && !hasPendingRequest && <button onClick={onAddFriend}>Add Friend</button>}
                  {hasPendingRequest && <button onClick={onAccept}>Accept Request</button>}
                  {isFriend && <span style={{ fontSize: "0.85rem", color: "var(--muted)", padding: "9px 0" }}>Friends ✓</span>}
                </>
              )}
            </div>
          </div>

          {editing && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <div className="form-group">
                <label>Full name</label>
                <input value={editForm.fullName || ""} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea value={editForm.bio || ""} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} style={{ minHeight: 60 }} />
              </div>
              {editErr && <div className="error-msg">{editErr}</div>}
              <button onClick={onSaveProfile}>Save Changes</button>
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      <h3 style={{ marginBottom: 14 }}>Posts ({posts.length})</h3>
      {posts.length === 0 ? (
        <div className="empty-state"><p>No visible posts yet.</p></div>
      ) : (
        posts.map(p => (
          <article key={p._id} className="card post-card">
            {editingPost === p._id ? (
              <div>
                <textarea value={editPostContent} onChange={e => setEditPostContent(e.target.value)} style={{ minHeight: 70, marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onSavePost(p._id)}>Save</button>
                  <button className="btn-ghost" onClick={() => setEditingPost(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="post-header">
                  <div className="avatar">{(profile.fullName || "?")[0].toUpperCase()}</div>
                  <div className="post-meta">
                    <div className="post-author">
                      <Link
                        to={`/profile/${profile._id}`}
                        style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}
                      >
                        {profile.fullName}
                      </Link>
                      {p.group && (
                        <Link to={`/groups/${p.group._id}`}>
                          <span className="post-group">{p.group.name}</span>
                        </Link>
                      )}
                    </div>
                    <div className="post-time">{timeAgo(p.createdAt)}</div>
                  </div>
                  {isOwnProfile && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-ghost" style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                        onClick={() => { setEditingPost(p._id); setEditPostContent(p.content); }}>Edit</button>
                      <button className="btn-ghost" style={{ fontSize: "0.8rem", padding: "4px 10px", color: "#d93025", borderColor: "#fad0cc" }}
                        onClick={() => onDeletePost(p._id)}>Delete</button>
                    </div>
                  )}
                </div>
                <p className="post-content">{p.content}</p>
                {p.mediaType === "video" && p.mediaUrl && (
                  <video controls style={{ width: "100%", borderRadius: 8, marginTop: 8 }}>
                    <source src={p.mediaUrl} />
                  </video>
                )}
                {p.mediaType === "image" && p.mediaUrl && (
                  <img src={p.mediaUrl} alt="" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />
                )}
                <MarketMentionChips mentions={p.marketMentions} onNavigate={() => nav("/market")} />
              </>
            )}
          </article>
        ))
      )}
    </div>
  );
}
