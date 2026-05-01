import { createContext, useContext, useState, useEffect } from 'react';
import { TokenStorage, getMe, configure as configureApiClient } from '@tradecircle/api-client';
import { connectSocket, disconnectSocket, configureSocket } from '@tradecircle/shared-hooks';
import { secureStoreAdapter, tokenStorageAdapter, setCachedToken, getCachedToken } from '../services/tokenStorage';

// Wire the shared packages to use expo-secure-store on startup.
TokenStorage.configure(tokenStorageAdapter);

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.7.7:5000/api';
configureApiClient({ baseURL: API_URL });
configureSocket({ serverURL: API_URL.replace(/\/api\/?$/, '') });

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await secureStoreAdapter.get();
        if (!token) return;
        setCachedToken(token);
        const res = await getMe();
        setUser(res.user);
        connectSocket(getCachedToken);
      } catch {
        await secureStoreAdapter.remove();
        setCachedToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loginUser = async (token, u) => {
    await secureStoreAdapter.set(token);
    setCachedToken(token);
    setUser(u);
    connectSocket(getCachedToken);
  };

  const logout = async () => {
    disconnectSocket();
    await secureStoreAdapter.remove();
    setCachedToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
