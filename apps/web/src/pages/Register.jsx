import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const nav = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", fullName: "" });
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setErr("");
    register(form)
      .done(res => { loginUser(res.token, res.user); nav("/"); })
      .fail(xhr => setErr(xhr.responseJSON?.message || "Registration failed"));
  };

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Create account</h2>
        <p className="subtitle">Join the network today</p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Full name</label>
            <input placeholder="John Doe" value={form.fullName} onChange={onChange("fullName")} autoFocus />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input placeholder="john_doe" value={form.username} onChange={onChange("username")} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input placeholder="john@example.com" type="email" value={form.email} onChange={onChange("email")} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input placeholder="••••••••" type="password" value={form.password} onChange={onChange("password")} />
          </div>
          <button type="submit">Create account</button>
        </form>
        {err && <div className="error-msg">{err}</div>}
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
