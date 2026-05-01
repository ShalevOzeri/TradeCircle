import { io } from "socket.io-client";

let socket = null;

export function connectSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io("http://localhost:5000", {
    auth: { token },
    autoConnect: true,
    reconnection: true
  });

  socket.on("connect_error", (err) => console.error("[socket] connection error:", err.message));
  return socket;
}

export function getSocket() { return socket; }

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}