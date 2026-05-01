import { useEffect, useState } from "react";
import { getFeed, createPost, toggleLike, addComment, deletePost, uploadMedia, getMarketQuotes } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import MarketMentionChips from "../components/MarketMentionChips";
import { timeAgo, initials } from "@tradecircle/utils";

const marketSnapshot = [
  { symbol: "BTC", name: "Bitcoin", price: "$68,420", change: "+2.1%", tone: "positive" },
  { symbol: "NVDA", name: "NVIDIA", price: "$1,205", change: "+1.4%", tone: "positive" },
  { symbol: "TSLA", name: "Tesla", price: "$182.55", change: "-0.8%", tone: "negative" }
];

const MEDIA_TYPES = ["none", "image", "video"];

export default function Feed() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [posts, setPosts]         = useState([]);
  const [content, setContent]     = useState("");
  const [mediaType, setMediaType] = useState("none");
  const [mediaUrl, setMediaUrl]   = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting]     = useState(false);
  const [commentText, setCommentText] = useState({});
  const [expanded, setExpanded]   = useState({});
  const [mentions, setMentions]       = useState([]);
  const [mentionPicker, setMentionPicker] = useState(false);
  const [mentionQ, setMentionQ]       = useState("");
  const [allMarket, setAllMarket]     = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);

  const loadFeed = () =>
    getFeed().done(res => setPosts(res.posts)).fail(err => console.error(err));

  useEffect(() => { loadFeed(); }, []);

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

  const submit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (mediaType !== "none" && !mediaUrl.trim()) {
      alert("Please provide media URL or upload a file");
      return;
    }
    setPosting(true);
    createPost({ content, mediaType, mediaUrl: mediaType !== "none" ? mediaUrl : "", marketMentions: mentions })
      .done(() => { setContent(""); setMediaType("none"); setMediaUrl(""); setMentions([]); loadFeed(); })
      .fail(err => alert(err.responseJSON?.message || "Failed to post"))
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

  const onLike = (id) =>
    toggleLike(id).done(() => loadFeed()).fail(console.error);

  const onComment = (id) => {
    const text = commentText[id];
    if (!text?.trim()) return;
    addComment(id, text)
      .done(() => { setCommentText({ ...commentText, [id]: "" }); loadFeed(); })
      .fail(err => alert(err.responseJSON?.message));
  };

  const onDelete = (id) => {
    if (!window.confirm("Delete this post?")) return;
    deletePost(id).done(loadFeed).fail(err => alert(err.responseJSON?.message));
  };

  return (
    <>
      <nav className="navbar">
        <span className="navbar-brand">TradeCircle</span>
        <div className="navbar-right">
          <Link to="/groups">Groups</Link>
          <Link to="/search">Search</Link>
          <Link to="/stats">Stats</Link>
          <Link to={`/profile/${user._id}`}><strong>{user.fullName}</strong></Link>
          <button className="btn-ghost" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="page-container">
        <section className="market-snapshot card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={{ marginBottom: 4 }}>Market Snapshot</h2>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>A live feed of assets, sectors, and discussions for amateur investors.</p>
            </div>
            <button className="btn-ghost" onClick={() => nav("/market")}>Explore market</button>
          </div>
          <div className="market-grid">
            {marketSnapshot.map((item) => (
              <div key={item.symbol} className="market-tile">
                <div className="market-tile-top">
                  <span className="market-symbol">{item.symbol}</span>
                  <span className={`market-change ${item.tone}`}>{item.change}</span>
                </div>
                <div className="market-name">{item.name}</div>
                <div className="market-price">{item.price}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Create post */}
        <div className="card create-post">
          <form onSubmit={submit}>
            <textarea
              placeholder={`What's on your mind, ${user.fullName.split(" ")[0]}?`}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <select value={mediaType} onChange={e => { setMediaType(e.target.value); setMediaUrl(""); }}
                style={{ width: "auto", padding: "6px 10px", fontSize: "0.85rem" }}>
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
                <input placeholder={mediaType === "image" ? "https://…/image.jpg" : "https://…/video.mp4"}
                  value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} style={{ flex: 1 }} />
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
            {/* Market mention chips (selected) */}
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

            {/* Mention picker dropdown */}
            {mentionPicker && (
              <div className="mention-picker" onClick={e => e.stopPropagation()}>
                <div className="mention-picker-header">
                  <input
                    autoFocus
                    placeholder="Search symbol or name…"
                    value={mentionQ}
                    onChange={e => setMentionQ(e.target.value)}
                  />
                  <button type="button" className="btn-ghost" onClick={() => { setMentionPicker(false); setMentionQ(""); }}>✕</button>
                </div>
                {marketLoading && <p className="mention-loading">Loading market data…</p>}
                {!marketLoading && allMarket && (
                  <div className="mention-list">
                    {allMarket
                      .filter(item => {
                        const q = mentionQ.trim().toLowerCase();
                        return !q || item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
                      })
                      .slice(0, 25)
                      .map(item => {
                        const already = mentions.some(m => m.symbol === item.symbol);
                        return (
                          <div key={item.symbol} className={`mention-option${already ? " already" : ""}`} onClick={() => !already && addMention(item)}>
                            <span className="mention-option-left">
                              <strong>{item.symbol}</strong>
                              <span className="mention-option-name">{item.name}</span>
                              <span className="mention-option-type">{item.type?.toUpperCase()}</span>
                            </span>
                            <span className={`mention-option-change ${(item.change ?? 0) >= 0 ? "positive" : "negative"}`}>
                              {(item.change ?? 0) >= 0 ? "+" : ""}{typeof item.change === "number" ? item.change.toFixed(2) : item.change}%
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            <div className="create-post-footer">
              {mentions.length < 5 && (
                <button type="button" className="btn-ghost mention-trigger-btn" onClick={openMentionPicker}>
                  $ Mention market
                </button>
              )}
              <button type="submit" disabled={posting || uploading || !content.trim()}>
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          </form>
        </div>

        {/* Feed */}
        {posts.length === 0 ? (
          <div className="empty-state">
            <p>No posts yet — be the first to share something!</p>
          </div>
        ) : (
          posts.map(p => {
            const isOwn = p.author?._id === user._id;
            const liked = p.likes?.includes(user._id);
            const showComments = expanded[p._id];
            return (
              <div key={p._id} className="card post-card" style={{ cursor: "pointer" }} onClick={() => nav(`/profile/${p.author?._id}`)}>
                <div className="post-header">
                  <div className="avatar">{initials(p.author?.fullName)}</div>
                  <div className="post-meta">
                    <div className="post-author" style={{ fontWeight: 600 }}>
                      {p.author?.fullName}
                      {p.group && (
                        <Link to={`/groups/${p.group._id}`} onClick={e => e.stopPropagation()}>
                          <span className="post-group">{p.group.name}</span>
                        </Link>
                      )}
                    </div>
                    <div className="post-time">{timeAgo(p.createdAt)}</div>
                  </div>
                  {isOwn && (
                    <button className="btn-ghost" style={{ fontSize: "0.8rem", padding: "4px 10px", color: "#d93025", borderColor: "#fad0cc" }}
                      onClick={(e) => { e.stopPropagation(); onDelete(p._id); }}>Delete</button>
                  )}
                </div>

                <p className="post-content">{p.content}</p>

                {/* Image media */}
                {p.mediaType === "image" && p.mediaUrl && (
                  <img src={p.mediaUrl} alt="post" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />
                )}

                {/* Video media */}
                {p.mediaType === "video" && p.mediaUrl && (
                  <video controls style={{ width: "100%", borderRadius: 8, marginTop: 8 }}>
                    <source src={p.mediaUrl} />
                    Your browser does not support the video tag.
                  </video>
                )}

                {/* Market mentions */}
                <MarketMentionChips mentions={p.marketMentions} onNavigate={() => nav("/market")} />

                {/* Actions */}
                <div style={{ display: "flex", gap: 12, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <button className="btn-ghost" style={{ fontSize: "0.85rem", padding: "4px 12px", color: liked ? "var(--primary)" : "var(--muted)", borderColor: liked ? "var(--primary)" : "var(--border)" }}
                    onClick={(e) => { e.stopPropagation(); onLike(p._id); }}>
                    ♥ {p.likes?.length || 0}
                  </button>
                  <button className="btn-ghost" style={{ fontSize: "0.85rem", padding: "4px 12px" }}
                    onClick={(e) => { e.stopPropagation(); setExpanded({ ...expanded, [p._id]: !showComments }); }}>
                    💬 {p.comments?.length || 0}
                  </button>
                </div>

                {/* Comments */}
                {showComments && (
                  <div style={{ marginTop: 12 }} onClick={e => e.stopPropagation()}>
                    {p.comments?.map((c, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: "0.75rem", flexShrink: 0 }}>
                          {(c.author?.fullName || "?")[0].toUpperCase()}
                        </div>
                        <div style={{ background: "var(--bg)", borderRadius: 8, padding: "6px 10px", flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{c.author?.fullName}</span>
                          <p style={{ fontSize: "0.85rem", margin: 0 }}>{c.text}</p>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input placeholder="Write a comment…"
                        value={commentText[p._id] || ""}
                        onChange={e => setCommentText({ ...commentText, [p._id]: e.target.value })}
                        onKeyDown={e => e.key === "Enter" && onComment(p._id)}
                        style={{ flex: 1 }} />
                      <button onClick={() => onComment(p._id)} style={{ flexShrink: 0 }}>Post</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
