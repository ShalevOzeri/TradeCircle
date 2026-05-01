import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getGroup, updateGroup, deleteGroup, joinGroup, approveJoin, removeMember, getGroupPosts, createPost, deletePost, uploadMedia, getMarketQuotes } from "../services/api";
import MarketMentionChips from "../components/MarketMentionChips";
import { useAuth } from "../context/AuthContext";
import { connectSocket } from "../services/socket";
import { timeAgo } from "@tradecircle/utils";

const CATEGORIES = ["general","tech","sports","music","gaming","education","other"];

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const [group, setGroup]   = useState(null);
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [tab, setTab]       = useState("posts");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editErr, setEditErr]  = useState("");

  // New post
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [mediaType, setMediaType] = useState("none");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mentions, setMentions]       = useState([]);
  const [mentionPicker, setMentionPicker] = useState(false);
  const [mentionQ, setMentionQ]       = useState("");
  const [allMarket, setAllMarket]     = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);

  const loadPosts = () =>
    getGroupPosts(id)
      .done((res) => setPosts(res.posts))
      .fail(() => setPosts([]));

  const loadGroup = () =>
    getGroup(id)
      .done((res) => {
        const nextGroup = res.group;
        setGroup(nextGroup);
        setLoadErr("");

        const isLockedPrivate =
          nextGroup?.privacy === "private" && !Array.isArray(nextGroup?.members);

        if (isLockedPrivate) {
          setPosts([]);
          return;
        }

        loadPosts();
      })
      .fail((xhr) => {
        setGroup(null);
        setPosts([]);
        setLoadErr(xhr?.responseJSON?.message || "Failed to load group");
      })
      .always(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    loadGroup();
  }, [id]);

  const onJoin = () => joinGroup(id).done(loadGroup).fail(xhr => alert(xhr.responseJSON?.message));

  const onApprove = (userId) =>
    approveJoin(id, userId).done(loadGroup).fail(xhr => alert(xhr.responseJSON?.message));

  const onRemove = (userId) =>
    removeMember(id, userId).done(loadGroup).fail(xhr => alert(xhr.responseJSON?.message));

  const onDelete = () => {
    if (!window.confirm(`Delete group "${group.name}"?`)) return;
    deleteGroup(id).done(() => nav("/groups")).fail(xhr => alert(xhr.responseJSON?.message));
  };

  const onSaveEdit = () => {
    setEditErr("");
    updateGroup(id, editForm)
      .done(res => { setGroup(res.group); setEditing(false); })
      .fail(xhr => setEditErr(xhr.responseJSON?.message || "Update failed"));
  };

  const openMentionPicker = () => {
    setMentionPicker(true);
    if (!allMarket && !marketLoading) {
      setMarketLoading(true);
      getMarketQuotes()
        .done(res => setAllMarket(res.quotes || []))
        .fail(() => setAllMarket([]))
        .always(() => setMarketLoading(false));
    }
  };

  const addMention = (item) => {
    if (mentions.length >= 5 || mentions.some(m => m.symbol === item.symbol)) return;
    setMentions(prev => [...prev, item]);
    setMentionPicker(false);
    setMentionQ("");
  };

  const onPost = e => {
    e.preventDefault();
    if (!content.trim()) return;
    if (mediaType !== "none" && !mediaUrl.trim()) {
      alert("Please provide media URL or upload a file");
      return;
    }
    setPosting(true);
    createPost({
      content, groupId: id, mediaType,
      mediaUrl: mediaType !== "none" ? mediaUrl.trim() : "",
      marketMentions: mentions
    })
      .done(() => {
        setContent("");
        setMediaType("none");
        setMediaUrl("");
        setMentions([]);
        loadPosts();
      })
      .fail(xhr => alert(xhr.responseJSON?.message || "Failed to post"))
      .always(() => setPosting(false));
  };

  const onFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      alert("Please choose an image or video file");
      e.target.value = "";
      return;
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File is too large. Maximum size is 500MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    uploadMedia(file)
      .done((res) => {
        setMediaType(res.mediaType || (isImage ? "image" : "video"));
        setMediaUrl(res.mediaUrl || "");
      })
      .fail((xhr) => {
        alert(xhr.responseJSON?.message || "Upload failed");
      })
      .always(() => {
        setUploading(false);
        e.target.value = "";
      });
  };

  const onDeletePost = (postId) => {
    if (!window.confirm("Delete this post?")) return;
    deletePost(postId).done(loadPosts).fail(xhr => alert(xhr.responseJSON?.message));
  };

  useEffect(() => {
    const socket = connectSocket();
    if (!socket || !id) return;

    socket.emit("group:watch", { groupId: id });

    const onPostNew = (post) => {
      const postGroupId = (post.group?._id || post.group || "").toString();
      if (postGroupId !== id) return;
      setPosts((prev) => {
        if (prev.some((p) => p._id === post._id)) return prev;
        return [post, ...prev];
      });
    };

    const onPostDeleted = ({ groupId, postId }) => {
      if (groupId !== id) return;
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    };

    const onPostComments = ({ groupId, postId, comments }) => {
      if (groupId !== id) return;
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, comments } : p)));
    };

    const onMembersUpdated = ({ groupId }) => {
      if (groupId !== id) return;
      loadGroup();
    };

    const onJoinApproved = ({ groupId }) => {
      if (groupId !== id) return;
      loadGroup();
    };

    const onRemoved = ({ groupId }) => {
      if (groupId !== id) return;
      loadGroup();
    };

    socket.on("group:post:new", onPostNew);
    socket.on("group:post:deleted", onPostDeleted);
    socket.on("group:post:comments", onPostComments);
    socket.on("group:members:updated", onMembersUpdated);
    socket.on("group:join-request:approved", onJoinApproved);
    socket.on("group:membership:removed", onRemoved);

    return () => {
      socket.emit("group:unwatch", { groupId: id });
      socket.off("group:post:new", onPostNew);
      socket.off("group:post:deleted", onPostDeleted);
      socket.off("group:post:comments", onPostComments);
      socket.off("group:members:updated", onMembersUpdated);
      socket.off("group:join-request:approved", onJoinApproved);
      socket.off("group:membership:removed", onRemoved);
    };
  }, [id]);

  if (loading) return <div className="page-container"><p>Loading…</p></div>;
  if (loadErr) return <div className="page-container"><p>{loadErr}</p></div>;
  if (!group)  return <div className="page-container"><p>Group not found.</p></div>;

  const isMember  = group.members?.some(m => (m._id || m).toString() === user._id);
  const isAdmin   = group.admins?.some(a => (a._id || a).toString() === user._id);
  const isPrivate = group.privacy === "private";
  // Backend returns limited object (no members array) for private groups the user can't see
  const isLocked  = isPrivate && !Array.isArray(group.members);

  return (
    <div className="page-container">
      <div style={{ marginBottom: 12 }}>
        <button className="btn-ghost" onClick={() => nav(-1)}>Back</button>
      </div>
      {/* Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        {editing ? (
          <div>
            <h3 style={{ marginBottom: 14 }}>Edit Group</h3>
            <div className="form-group">
              <label>Name</label>
              <input value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={editForm.description || ""} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ minHeight: 70 }} />
            </div>
            <div className="search-grid">
              <div className="form-group">
                <label>Category</label>
                <select value={editForm.category || "general"} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Privacy</label>
                <select value={editForm.privacy || "public"} onChange={e => setEditForm({ ...editForm, privacy: e.target.value })}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            {editErr && <div className="error-msg">{editErr}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={onSaveEdit}>Save</button>
              <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ marginBottom: 6 }}>{group.name}</h2>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <span className={`privacy-badge ${group.privacy}`}>{group.privacy}</span>
                  <span className="category-badge">{group.category}</span>
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{group.description}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 6 }}>
                  {group.members?.length || 0} members · {group.admins?.length || 0} admin(s)
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {!isMember && (
                  <button onClick={onJoin}>{isPrivate ? "Request to Join" : "Join"}</button>
                )}
                {isAdmin && (
                  <>
                    <button className="btn-ghost" onClick={() => { setEditing(true); setEditForm({ name: group.name, description: group.description, category: group.category, privacy: group.privacy }); }}>
                      Edit
                    </button>
                    <button className="btn-ghost" style={{ color: "#d93025", borderColor: "#fad0cc" }} onClick={onDelete}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Private group locked banner */}
      {isLocked && (
        <div style={{
          background: "#fff8e1",
          border: "1px solid #ffe082",
          borderRadius: "var(--radius)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 20,
        }}>
          <span style={{ fontSize: "2rem" }}>🔒</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>
              This is a private group
            </div>
            <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Content is visible to members only. Send a join request and wait for admin approval to access posts and members.
            </div>
          </div>
        </div>
      )}

      {/* Tabs — only show if user has access */}
      {!isLocked && <div className="tab-bar" style={{ marginBottom: 16 }}>
        <button className={tab === "posts" ? "" : "btn-ghost"} onClick={() => setTab("posts")}>Posts</button>
        {isMember && <button className={tab === "members" ? "" : "btn-ghost"} onClick={() => setTab("members")}>Members</button>}
        {isAdmin && group.pendingRequests?.length > 0 && (
          <button className={tab === "requests" ? "" : "btn-ghost"} onClick={() => setTab("requests")}>
            Pending ({group.pendingRequests.length})
          </button>
        )}
      </div>}

      {/* Posts tab — only render when user has access */}
      {!isLocked && tab === "posts" && (
        <>
          {isMember && (
            <div className="card create-post" style={{ marginBottom: 20 }}>
              <form onSubmit={onPost}>
                <textarea placeholder="Post to this group…" value={content} onChange={e => setContent(e.target.value)} />
                <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                  <select
                    value={mediaType}
                    onChange={e => {
                      setMediaType(e.target.value);
                      if (e.target.value === "none") setMediaUrl("");
                    }}
                    style={{ width: "auto", padding: "6px 10px", fontSize: "0.85rem" }}
                  >
                    <option value="none">Text only</option>
                    <option value="image">Image URL</option>
                    <option value="video">Video URL</option>
                  </select>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={onFileSelected}
                    style={{ flex: 1 }}
                  />
                  {mediaType !== "none" && (
                    <input
                      placeholder={mediaType === "image" ? "https://.../image.jpg" : "https://.../video.mp4"}
                      value={mediaUrl}
                      onChange={e => setMediaUrl(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  )}
                </div>
                {uploading && <p style={{ marginBottom: 8, color: "var(--muted)", fontSize: "0.85rem" }}>Uploading media…</p>}
                {mediaType === "image" && mediaUrl && (
                  <img src={mediaUrl} alt="preview" style={{ width: "100%", borderRadius: 8, marginBottom: 10 }} />
                )}
                {mediaType === "video" && mediaUrl && (
                  <video controls style={{ width: "100%", borderRadius: 8, marginBottom: 10 }}>
                    <source src={mediaUrl} />
                  </video>
                )}
                {mentions.length > 0 && (
                  <div className="post-market-mentions" style={{ marginBottom: 10 }}>
                    {mentions.map(m => (
                      <span key={m.symbol} className="post-market-chip">
                        <span className="pmc-symbol">${m.symbol}</span>
                        <span className="pmc-price">{m.name}</span>
                        <span className={`pmc-change ${(m.change ?? 0) >= 0 ? "positive" : "negative"}`}>
                          {(m.change ?? 0) >= 0 ? "+" : ""}{typeof m.change === "number" ? m.change.toFixed(2) : m.change}%
                        </span>
                        <button type="button" className="pmc-remove" onClick={() => setMentions(prev => prev.filter(x => x.symbol !== m.symbol))}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
                {mentionPicker && (
                  <div className="mention-picker" onClick={e => e.stopPropagation()}>
                    <div className="mention-picker-header">
                      <input autoFocus placeholder="Search symbol or name…" value={mentionQ} onChange={e => setMentionQ(e.target.value)} />
                      <button type="button" className="btn-ghost" onClick={() => { setMentionPicker(false); setMentionQ(""); }}>✕</button>
                    </div>
                    {marketLoading && <p className="mention-loading">Loading market data…</p>}
                    {!marketLoading && allMarket && (
                      <div className="mention-list">
                        {allMarket.filter(item => { const q = mentionQ.trim().toLowerCase(); return !q || item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q); }).slice(0, 25).map(item => {
                          const already = mentions.some(m => m.symbol === item.symbol);
                          return (
                            <div key={item.symbol} className={`mention-option${already ? " already" : ""}`} onClick={() => !already && addMention(item)}>
                              <span className="mention-option-left"><strong>{item.symbol}</strong><span className="mention-option-name">{item.name}</span><span className="mention-option-type">{item.type?.toUpperCase()}</span></span>
                              <span className={`mention-option-change ${(item.change ?? 0) >= 0 ? "positive" : "negative"}`}>{(item.change ?? 0) >= 0 ? "+" : ""}{typeof item.change === "number" ? item.change.toFixed(2) : item.change}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <div className="create-post-footer">
                  {mentions.length < 5 && (
                    <button type="button" className="btn-ghost mention-trigger-btn" onClick={openMentionPicker}>$ Mention market</button>
                  )}
                  <button type="submit" disabled={posting || uploading || !content.trim()}>
                    {posting ? "Posting…" : "Post"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {(!isMember && isPrivate) ? (
            <div className="empty-state"><p>Join this group to see posts.</p></div>
          ) : posts.length === 0 ? (
            <div className="empty-state"><p>No posts in this group yet.</p></div>
          ) : (
            posts.map(p => {
              const isOwn = p.author?._id === user._id || p.author === user._id;
              return (
                <div key={p._id} className="card post-card" style={{ cursor: "pointer" }} onClick={() => nav(`/profile/${p.author?._id}`)}>
                  <div className="post-header">
                    <div className="avatar">{(p.author?.fullName || "?")[0].toUpperCase()}</div>
                    <div className="post-meta">
                      <div className="post-author" style={{ fontWeight: 600 }}>
                        {p.author?.fullName}
                      </div>
                      <div className="post-time">{timeAgo(p.createdAt)}</div>
                    </div>
                    {(isOwn || isAdmin) && (
                      <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#d93025", borderColor: "#fad0cc" }}
                        onClick={(e) => { e.stopPropagation(); onDeletePost(p._id); }}>Delete</button>
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
                </div>
              );
            })
          )}
        </>
      )}

      {/* Members tab */}
      {!isLocked && tab === "members" && (
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Members ({group.members?.length || 0})</h3>
          {group.members?.map(m => {
            const mId = m._id || m;
            const mIsAdmin = group.admins?.some(a => (a._id || a).toString() === mId.toString());
            return (
              <div key={mId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="avatar" style={{ width: 34, height: 34, fontSize: "0.85rem" }}>
                  {(m.fullName || "?")[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{m.fullName}</div>
                  {mIsAdmin && <span className="admin-badge" style={{ fontSize: "0.7rem" }}>Admin</span>}
                </div>
                {isAdmin && mId.toString() !== user._id && (
                  <button className="btn-ghost" style={{ fontSize: "0.8rem", padding: "4px 10px", color: "#d93025", borderColor: "#fad0cc" }}
                    onClick={() => onRemove(mId)}>Remove</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pending requests tab */}
      {!isLocked && tab === "requests" && isAdmin && (
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Pending Requests ({group.pendingRequests?.length || 0})</h3>
          {group.pendingRequests?.map(u => (
            <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="avatar" style={{ width: 34, height: 34, fontSize: "0.85rem" }}>
                {(u.fullName || "?")[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{u.fullName}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>@{u.username}</div>
              </div>
              <button onClick={() => onApprove(u._id)} style={{ fontSize: "0.85rem" }}>Approve</button>
            </div>
          ))}
          {group.pendingRequests?.length === 0 && <p style={{ color: "var(--muted)" }}>No pending requests.</p>}
        </div>
      )}
    </div>
  );
}
