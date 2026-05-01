import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'token';

function getWebStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

// Drop-in adapter for @tradecircle/api-client's TokenStorage.configure()
// and for the socket service's getToken callback.
export const secureStoreAdapter = {
  get: () => {
    if (Platform.OS === 'web') {
      const storage = getWebStorage();
      return Promise.resolve(storage ? storage.getItem(TOKEN_KEY) : null);
    }

    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  set: (t) => {
    if (Platform.OS === 'web') {
      const storage = getWebStorage();
      if (storage) storage.setItem(TOKEN_KEY, t);
      return Promise.resolve();
    }

    return SecureStore.setItemAsync(TOKEN_KEY, t);
  },
  remove: () => {
    if (Platform.OS === 'web') {
      const storage = getWebStorage();
      if (storage) storage.removeItem(TOKEN_KEY);
      return Promise.resolve();
    }

    return SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

export const tokenStorageAdapter = {
  get: () => _cachedToken,
  set: (token) => {
    _cachedToken = token;
  },
  remove: () => {
    _cachedToken = null;
  },
};

// Synchronous fallback used by the socket service (which needs a sync getToken).
// We keep an in-memory copy that is set on login / cleared on logout.
let _cachedToken = null;

export function setCachedToken(t) { _cachedToken = t; }
export function getCachedToken() { return _cachedToken; }
