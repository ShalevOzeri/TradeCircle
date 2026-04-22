import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PostsPerMonth from "../components/charts/PostsPerMonth";
import TopGroups from "../components/charts/TopGroups";
import "./Stats.css";

export default function Stats() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [months, setMonths] = useState(12);
  const [days, setDays] = useState(30);

  return (
    <>
      <nav className="navbar">
        <span className="navbar-brand">TradeCircle</span>
        <div className="navbar-right">
          <Link to="/">Feed</Link>
          <Link to="/groups">Groups</Link>
          <Link to="/search">Search</Link>
          <Link to={`/profile/${user._id}`}><strong>{user.fullName}</strong></Link>
          <button className="btn-ghost" onClick={logout}>Logout</button>
        </div>
      </nav>
    <div className="stats-page">
      <div style={{ marginBottom: 12 }}>
        <button className="btn-ghost" onClick={() => nav(-1)}>Back</button>
      </div>
      <h1>Network Statistics</h1>
      <section className="chart-card">
        <div className="chart-controls">
          <label>Time range:{" "}
            <select value={months} onChange={e => setMonths(Number(e.target.value))}>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
              <option value={24}>Last 24 months</option>
            </select>
          </label>
        </div>
        <PostsPerMonth months={months} />
      </section>
      <section className="chart-card">
        <div className="chart-controls">
          <label>Period:{" "}
            <select value={days} onChange={e => setDays(Number(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
        </div>
        <TopGroups days={days} />
      </section>
    </div>
    </>
  );
}