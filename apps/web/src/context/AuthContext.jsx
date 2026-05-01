import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    getMe()
      .done(res => { setUser(res.user); connectSocket(); })
      .fail(() => localStorage.removeItem("token"))
      .always(() => setLoading(false));
  }, []);

  const loginUser = (token, u) => {
    localStorage.setItem("token", token);
    setUser(u);
    connectSocket();
  };

  const logout = () => {
    disconnectSocket();
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);