const { TokenStorage } = require('./token');

// Priority: Expo env → CRA env → localhost fallback.
// Set EXPO_PUBLIC_API_URL (mobile) or REACT_APP_API_URL (web) in .env files.
let _baseURL =
  (typeof process !== 'undefined' &&
    (process.env.EXPO_PUBLIC_API_URL ||
     process.env.REACT_APP_API_URL)) ||
  'http://localhost:5000/api';

function configure(options) {
  if (options && options.baseURL) _baseURL = options.baseURL;
}

function normalizeURL(url, params) {
  const full = `${_baseURL}${url}`;
  if (!params || Object.keys(params).length === 0) return full;

  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  });
  const q = qs.toString();
  return q ? `${full}${full.includes('?') ? '&' : '?'}${q}` : full;
}

async function request(method, url, data, config = {}) {
  const token = TokenStorage.get();
  const headers = { ...(config.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const fetchConfig = {
    method,
    headers,
  };

  if (data !== undefined) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    if (isFormData) {
      fetchConfig.body = data;
    } else {
      headers['Content-Type'] = 'application/json';
      fetchConfig.body = JSON.stringify(data);
    }
  }

  const res = await fetch(normalizeURL(url, config.params), fetchConfig);
  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const err = new Error(`Request failed with status ${res.status}`);
    err.response = {
      status: res.status,
      statusText: res.statusText,
      data: payload,
    };
    throw err;
  }

  return {
    data: payload,
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  };
}

function getClient() {
  return {
    get: (url, config) => request('GET', url, undefined, config),
    post: (url, data, config) => request('POST', url, data, config),
    put: (url, data, config) => request('PUT', url, data, config),
    delete: (url, config) => request('DELETE', url, undefined, config),
  };
}

module.exports = { getClient, configure };
