import { useState } from "react";
import { searchPosts, searchGroups, listUsers } from "../services/api";
import { Link, useNavigate } from "react-router-dom";

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
}

const CATEGORIES = ["general","tech","sports","music","gaming","education","other"];

export default function SearchPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState("posts");

  // Post search state
  const [postForm, setPostForm] = useState({ q: "", mediaType: "", tag: "", from: "", to: "", sortBy: "" });
  const [postResults, setPostResults] = useState(null);
  const [postLoading, setPostLoading] = useState(false);

  // Group search state
  const [groupForm, setGroupForm] = useState({ q: "", category: "", privacy: "", minMembers: "", createdAfter: "" });
  const [groupResults, setGroupResults] = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);

  // User search state
  const [userQ, setUserQ] = useState("");
  const [userResults, setUserResults] = useState(null);

  const onPostChange = k => e => setPostForm({ ...postForm, [k]: e.target.value });
  const onGroupChange = k => e => setGroupForm({ ...groupForm, [k]: e.target.value });

  const searchPost = e => {
    e.preventDefault();
    setPostLoading(true);
    const params = Object.fromEntries(Object.entries(postForm).filter(([, v]) => v !== ""));
    searchPosts(params)
      .done(res => setPostResults(res))
      .fail(() => setPostResults({ posts: [], count: 0 }))
      .always(() => setPostLoading(false));
  };

  const searchGroup = e => {
    e.preventDefault();
    setGroupLoading(true);
    const params = Object.fromEntries(Object.entries(groupForm).filter(([, v]) => v !== ""));
    searchGroups(params)
      .done(res => setGroupResults(res))
      .fail(() => setGroupResults({ groups: [], count: 0 }))
      .always(() => setGroupLoading(false));
  };

  const searchUser = e => {
    e.preventDefault();
    listUsers({ q: userQ })
      .done(res => setUserResults(res.users))
      .fail(() => setUserResults([]));
  };

  return (
    <div className="page-container">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button className="btn-ghost" onClick={() => nav(-1)}>Back</button>
        <h2 style={{ marginBottom: 0 }}>Advanced Search</h2>
      </div>

      <div className="tab-bar">
        {["posts", "groups", "users"].map(t => (
          <button key={t} className={tab === t ? "" : "btn-ghost"} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── POST SEARCH ─────────────────────── */}
      {tab === "posts" && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 16 }}>Search Posts</h3>
          <form onSubmit={searchPost}>
            <div className="search-grid">
              <div className="form-group">
                <label>Keyword</label>
                <input placeholder="e.g. react, football..." value={postForm.q} onChange={onPostChange("q")} />
              </div>
              <div className="form-group">
                <label>Media type</label>
                <select value={postForm.mediaType} onChange={onPostChange("mediaType")}>
                  <option value="">Any</option>
                  <option value="none">Text only</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tag</label>
                <input placeholder="e.g. news" value={postForm.tag} onChange={onPostChange("tag")} />
              </div>
              <div className="form-group">
                <label>From date</label>
                <input type="date" value={postForm.from} onChange={onPostChange("from")} />
              </div>
              <div className="form-group">
                <label>To date</label>
                <input type="date" value={postForm.to} onChange={onPostChange("to")} />
              </div>
              <div className="form-group">
                <label>Sort by</label>
                <select value={postForm.sortBy} onChange={onPostChange("sortBy")}>
                  <option value="">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Most popular</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={postLoading} style={{ marginTop: 8 }}>
              {postLoading ? "Searching…" : "Search Posts"}
            </button>
          </form>

          {postResults && (
            <div style={{ marginTop: 20 }}>
              <p style={{ color: "var(--muted)", marginBottom: 12 }}>{postResults.count} result(s)</p>
              {postResults.posts.map(p => (
                <article key={p._id} className="card post-card">
                  <div className="post-header">
                    <div className="avatar">{(p.author?.fullName || "?")[0].toUpperCase()}</div>
                    <div className="post-meta">
                      <div className="post-author">{p.author?.fullName}
                        {p.group && <span className="post-group">{p.group.name}</span>}
                      </div>
                      <div className="post-time">{timeAgo(p.createdAt)}</div>
                    </div>
                  </div>
                  <p className="post-content">{p.content}</p>
                  {p.mediaType === "video" && p.mediaUrl && (
                    <video controls style={{ width: "100%", borderRadius: 8, marginTop: 8 }}>
                      <source src={p.mediaUrl} />
                    </video>
                  )}
                  {p.mediaType === "image" && p.mediaUrl && (
                    <img src={p.mediaUrl} alt="post media" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />
                  )}
                </article>
              ))}
              {postResults.posts.length === 0 && <p style={{ color: "var(--muted)" }}>No posts found.</p>}
            </div>
          )}
        </div>
      )}

      {/* ── GROUP SEARCH ────────────────────── */}
      {tab === "groups" && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 16 }}>Search Groups</h3>
          <form onSubmit={searchGroup}>
            <div className="search-grid">
              <div className="form-group">
                <label>Name</label>
                <input placeholder="e.g. Tech lovers" value={groupForm.q} onChange={onGroupChange("q")} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={groupForm.category} onChange={onGroupChange("category")}>
                  <option value="">Any</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Privacy</label>
                <select value={groupForm.privacy} onChange={onGroupChange("privacy")}>
                  <option value="">Any</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="form-group">
                <label>Min members</label>
                <input type="number" min="0" placeholder="e.g. 5" value={groupForm.minMembers} onChange={onGroupChange("minMembers")} />
              </div>
              <div className="form-group">
                <label>Created after</label>
                <input type="date" value={groupForm.createdAfter} onChange={onGroupChange("createdAfter")} />
              </div>
            </div>
            <button type="submit" disabled={groupLoading} style={{ marginTop: 8 }}>
              {groupLoading ? "Searching…" : "Search Groups"}
            </button>
          </form>

          {groupResults && (
            <div style={{ marginTop: 20 }}>
              <p style={{ color: "var(--muted)", marginBottom: 12 }}>{groupResults.count} result(s)</p>
              <div className="groups-columns">
                {groupResults.groups.map(g => (
                  <div key={g._id} className="card group-card">
                    <div className="group-card-name">{g.name}</div>
                    <span className={`privacy-badge ${g.privacy}`}>{g.privacy}</span>
                    <span className="category-badge">{g.category}</span>
                    <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "8px 0" }}>{g.description}</p>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{g.members?.length || 0} members</div>
                    <Link to={`/groups/${g._id}`}>
                      <button style={{ marginTop: 10, width: "100%" }}>View</button>
                    </Link>
                  </div>
                ))}
              </div>
              {groupResults.groups.length === 0 && <p style={{ color: "var(--muted)" }}>No groups found.</p>}
            </div>
          )}
        </div>
      )}

      {/* ── USER SEARCH ─────────────────────── */}
      {tab === "users" && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 16 }}>Search Users</h3>
          <form onSubmit={searchUser} style={{ display: "flex", gap: 10 }}>
            <input placeholder="Search by name or username…" value={userQ} onChange={e => setUserQ(e.target.value)} />
            <button type="submit" style={{ flexShrink: 0 }}>Search</button>
          </form>
          {userResults && (
            <div style={{ marginTop: 20 }}>
              {userResults.map(u => (
                <div key={u._id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, padding: "12px 16px" }}>
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: "0.9rem" }}>
                    {(u.fullName || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>@{u.username}</div>
                  </div>
                  <Link to={`/profile/${u._id}`}>
                    <button className="btn-ghost" style={{ padding: "6px 14px" }}>Profile</button>
                  </Link>
                </div>
              ))}
              {userResults.length === 0 && <p style={{ color: "var(--muted)" }}>No users found.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
