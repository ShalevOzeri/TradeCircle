import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { connectSocket, getSocket } from "../services/socket";
import { getConversation } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./ChatBox.css";

export default function ChatBox({ otherUser, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [theyAreTyping, setTheyAreTyping] = useState(false);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    let socket = connectSocket();
    if (!socket) return;

    getConversation(otherUser._id)
      .done(res => setMessages(res.messages))
      .fail(err => console.error("Load history failed", err));

    socket.emit("message:read", { fromUserId: otherUser._id });

    const onNew = (msg) => {
      const isRelevant =
        (msg.from._id === otherUser._id && msg.to === user._id) ||
        (msg.from._id === user._id && msg.to === otherUser._id);
      if (!isRelevant) return;
      setMessages(prev => [...prev, msg]);
      if (msg.from._id === otherUser._id) {
        socket.emit("message:read", { fromUserId: otherUser._id });
      }
    };

    const onTypingStart = ({ from }) => { if (from === otherUser._id) setTheyAreTyping(true); };
    const onTypingStop  = ({ from }) => { if (from === otherUser._id) setTheyAreTyping(false); };

    socket.on("message:new", onNew);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop",  onTypingStop);

    return () => {
      socket.off("message:new", onNew);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop",  onTypingStop);
    };
  }, [otherUser._id, user._id]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const socket = getSocket();
    socket.emit("message:send", { to: otherUser._id, text: trimmed }, (res) => {
      if (!res.ok) alert("Failed to send: " + res.error);
    });
    setText("");
    socket.emit("typing:stop", { to: otherUser._id });
  };

  const handleChange = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    socket.emit("typing:start", { to: otherUser._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { to: otherUser._id });
    }, 1500);
  };

  return (
    <div className="chat-box">
      <div className="chat-header">
        <Link to={`/profile/${otherUser._id}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>
          {otherUser.fullName}
        </Link>
        <button onClick={onClose} aria-label="Close">x</button>
      </div>
      <div className="chat-messages" ref={scrollRef}>
        {messages.map(m => (
          <div key={m._id} className={`chat-msg ${m.from._id === user._id ? "mine" : "theirs"}`}>
            <div className="bubble">
              <Link
                to={`/profile/${m.from._id}`}
                style={{ color: "inherit", textDecoration: "underline", fontSize: "0.75rem", opacity: 0.85, display: "inline-block", marginBottom: 4 }}
              >
                {m.from?.fullName || m.from?.username || "User"}
              </Link>
              <div>{m.text}</div>
            </div>
            <div className="meta">
              {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}
        {theyAreTyping && <div className="chat-msg theirs"><div className="bubble typing">typing...</div></div>}
      </div>
      <div className="chat-input">
        <input type="text" value={text} onChange={handleChange}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Type a message..." maxLength={1000} />
        <button onClick={send} disabled={!text.trim()}>Send</button>
      </div>
    </div>
  );
}