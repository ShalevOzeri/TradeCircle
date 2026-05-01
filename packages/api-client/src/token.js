// Platform-agnostic token storage.
// Web default: localStorage. Mobile override via TokenStorage.configure().

let _impl = {
  get: () => (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null),
  set: (t) => { if (typeof localStorage !== 'undefined') localStorage.setItem('token', t); },
  remove: () => { if (typeof localStorage !== 'undefined') localStorage.removeItem('token'); },
};

const TokenStorage = {
  // Mobile (React Native) calls this on app init with expo-secure-store adapter
  configure(impl) { _impl = impl; },
  get() { return _impl.get(); },
  set(token) { _impl.set(token); },
  remove() { _impl.remove(); },
};

module.exports = { TokenStorage };
