// Shared React hooks and services for web and mobile.
// socket service: web uses socket.io-client directly (already in apps/web/node_modules).
// Mobile will configure the socket URL via configureSocket() on app init.

const socketClientModule = require('socket.io-client');
const io =
  (socketClientModule && socketClientModule.io) ||
  (socketClientModule && socketClientModule.default) ||
  socketClientModule;

let _socket = null;
let _serverURL =
  (typeof process !== 'undefined' &&
    (process.env.EXPO_PUBLIC_SERVER_URL ||
     process.env.REACT_APP_SERVER_URL)) ||
  'http://localhost:5000';

function configureSocket(options) {
  if (options && options.serverURL) _serverURL = options.serverURL;
}

function connectSocket(getToken) {
  if (typeof io !== 'function') {
    console.error('[socket] socket.io client export is not callable');
    return null;
  }

  if (typeof getToken !== 'function') {
    console.error('[socket] getToken callback was not provided');
    return null;
  }

  const token = getToken();
  if (!token) return null;
  if (_socket && _socket.connected) return _socket;

  _socket = io(_serverURL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
  });

  _socket.on('connect_error', (err) =>
    console.error('[socket] connection error:', err.message)
  );

  return _socket;
}

function getSocket() { return _socket; }

function disconnectSocket() {
  if (_socket) { _socket.disconnect(); _socket = null; }
}

module.exports = { configureSocket, connectSocket, getSocket, disconnectSocket };
