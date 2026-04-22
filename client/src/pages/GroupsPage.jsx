import { useEffect, useState } from "react";
import { listGroups, createGroup, joinGroup } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["general","tech","sports","music","gaming","education","other"];

export default function GroupsPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", privacy: "public", category: "general" });
  const [err, setErr] = useState("");
  const [filterQ, setFilterQ] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const load = () =>
    listGroups({ q: filterQ, category: filterCat })
      .done(res => setGroups(res.groups))
      .fail(() => setGroups([]));

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [filterQ, filterCat]);

  const onCreate = e => {
    e.preventDefault();
    setErr("");
    if (!form.name.trim()) { setErr("Name is required"); return; }
    createGroup(form)
      .done(() => { setShowCreate(false); setForm({ name: "", description: "", privacy: "public", category: "general" }); load(); })
      .fail(xhr => setErr(xhr.responseJSON?.message || "Failed to create group"));
  };

  const onJoin = (id) => {
    joinGroup(id)
      .done(() => load())
      .fail(xhr => alert(xhr.responseJSON?.message || "Failed to join"));
  };

  const onFilter = e => {
    e.preventDefault();
    load();
  };

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn-ghost" onClick={() => nav(-1)}>Back</button>
          <h2>Groups</h2>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ Create Group"}
        </button>
      </div>

      {/* Create group form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>New Group</h3>
          <form onSubmit={onCreate}>
            <div className="form-group">
              <label>Name</label>
              <input placeholder="Group name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="What is this group about?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: 70 }} />
            </div>
            <div className="search-grid">
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Privacy</label>
                <select value={form.privacy} onChange={e => setForm({ ...form, privacy: e.target.value })}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            {err && <div className="error-msg">{err}</div>}
            <button type="submit" style={{ marginTop: 8 }}>Create</button>
          </form>
        </div>
      )}

      {/* Filter bar */}
      <form onSubmit={onFilter} className="card" style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-end", padding: "14px 16px" }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Filter by name</label>
          <input placeholder="Search groups…" value={filterQ} onChange={e => setFilterQ(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Category</label>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button type="submit" style={{ marginBottom: 0 }}>Filter</button>
      </form>

      {/* Groups grid - multiple columns */}
      {groups.length === 0 ? (
        <div className="empty-state"><p>No groups yet.</p></div>
      ) : (
        <div className="groups-columns">
          {groups.map(g => {
            const isMember = g.members?.some(m => (m._id || m) === user._id || (m._id || m).toString() === user._id);
            const isAdmin  = g.admins?.some(a => (a._id || a) === user._id || (a._id || a).toString() === user._id);
            return (
              <div key={g._id} className="card group-card">
                <div className="group-card-name">{g.name}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  <span className={`privacy-badge ${g.privacy}`}>{g.privacy}</span>
                  <span className="category-badge">{g.category}</span>
                  {isAdmin && <span className="admin-badge">Admin</span>}
                  {isMember && !isAdmin && <span className="member-badge">Member</span>}
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 10 }}>
                  {g.description || "No description."}
                </p>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 12 }}>
                  {g.members?.length || 0} members
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link to={`/groups/${g._id}`} style={{ flex: 1 }}>
                    <button style={{ width: "100%" }}>View</button>
                  </Link>
                  {!isMember && (
                    <button className="btn-ghost" onClick={() => onJoin(g._id)} style={{ flex: 1 }}>Join</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
