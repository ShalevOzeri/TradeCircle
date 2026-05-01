// Socket service for web — delegates to @tradecircle/shared-hooks.
// Token is read from localStorage via the callback pattern so the shared
// package stays platform-agnostic (mobile will pass expo-secure-store reader).
import {
  connectSocket as _connectSocket,
  getSocket,
  disconnectSocket,
} from '@tradecircle/shared-hooks';

const getToken = () => localStorage.getItem('token');

export { getSocket, disconnectSocket };

export function connectSocket() {
  return _connectSocket(getToken);
}
