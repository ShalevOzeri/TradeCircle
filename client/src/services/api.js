import $ from "jquery";

const BASE = "http://localhost:5000/api";

$.ajaxSetup({
  beforeSend: (xhr) => {
    const token = localStorage.getItem("token");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }
});

// Auth
export const login = (username, password) =>
  $.ajax({ url: `${BASE}/auth/login`, method: "POST", contentType: "application/json", data: JSON.stringify({ username, password }) });

export const register = (payload) =>
  $.ajax({ url: `${BASE}/auth/register`, method: "POST", contentType: "application/json", data: JSON.stringify(payload) });

export const getMe = () =>
  $.ajax({ url: `${BASE}/auth/me`, method: "GET" });

// Posts
export const getFeed = () =>
  $.ajax({ url: `${BASE}/posts/feed`, method: "GET" });

export const createPost = (payload) =>
  $.ajax({ url: `${BASE}/posts`, method: "POST", contentType: "application/json", data: JSON.stringify(payload) });

export const updatePost = (id, payload) =>
  $.ajax({ url: `${BASE}/posts/${id}`, method: "PUT", contentType: "application/json", data: JSON.stringify(payload) });

export const deletePost = (id) =>
  $.ajax({ url: `${BASE}/posts/${id}`, method: "DELETE" });

export const toggleLike = (id) =>
  $.ajax({ url: `${BASE}/posts/${id}/like`, method: "POST" });

export const addComment = (id, text) =>
  $.ajax({ url: `${BASE}/posts/${id}/comments`, method: "POST", contentType: "application/json", data: JSON.stringify({ text }) });

export const getUserPosts = (userId) =>
  $.ajax({ url: `${BASE}/posts/user/${userId}`, method: "GET" });

export const getGroupPosts = (groupId) =>
  $.ajax({ url: `${BASE}/posts/group/${groupId}`, method: "GET" });

export const searchPosts = (params) =>
  $.ajax({ url: `${BASE}/posts/search`, method: "GET", data: params });

export const uploadMedia = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return $.ajax({
    url: `${BASE}/posts/upload`,
    method: "POST",
    data: formData,
    processData: false,
    contentType: false
  });
};

// Groups
export const listGroups = (params = {}) =>
  $.ajax({ url: `${BASE}/groups`, method: "GET", data: params });

export const getGroup = (id) =>
  $.ajax({ url: `${BASE}/groups/${id}`, method: "GET" });

export const createGroup = (payload) =>
  $.ajax({ url: `${BASE}/groups`, method: "POST", contentType: "application/json", data: JSON.stringify(payload) });

export const updateGroup = (id, payload) =>
  $.ajax({ url: `${BASE}/groups/${id}`, method: "PUT", contentType: "application/json", data: JSON.stringify(payload) });

export const deleteGroup = (id) =>
  $.ajax({ url: `${BASE}/groups/${id}`, method: "DELETE" });

export const joinGroup = (id) =>
  $.ajax({ url: `${BASE}/groups/${id}/join`, method: "POST" });

export const approveJoin = (groupId, userId) =>
  $.ajax({ url: `${BASE}/groups/${groupId}/approve/${userId}`, method: "POST" });

export const removeMember = (groupId, userId) =>
  $.ajax({ url: `${BASE}/groups/${groupId}/members/${userId}`, method: "DELETE" });

export const searchGroups = (params) =>
  $.ajax({ url: `${BASE}/groups/search`, method: "GET", data: params });

// Users
export const listUsers = (params = {}) =>
  $.ajax({ url: `${BASE}/users`, method: "GET", data: params });

export const getUser = (id) =>
  $.ajax({ url: `${BASE}/users/${id}`, method: "GET" });

export const updateProfile = (id, payload) =>
  $.ajax({ url: `${BASE}/users/${id}`, method: "PUT", contentType: "application/json", data: JSON.stringify(payload) });

export const sendFriendRequest = (id) =>
  $.ajax({ url: `${BASE}/users/${id}/friend-request`, method: "POST" });

export const acceptFriendRequest = (requesterId) =>
  $.ajax({ url: `${BASE}/users/friend-request/${requesterId}/accept`, method: "POST" });

// Messages
export const getInbox = () =>
  $.ajax({ url: `${BASE}/messages`, method: "GET" });

export const getConversation = (otherUserId) =>
  $.ajax({ url: `${BASE}/messages/${otherUserId}`, method: "GET" });

// Stats
export const getPostsPerMonth = (params = {}) =>
  $.ajax({ url: `${BASE}/stats/posts-per-month`, method: "GET", data: params });

export const getTopGroups = (params = {}) =>
  $.ajax({ url: `${BASE}/stats/top-groups`, method: "GET", data: params });

export const getUserActivity = (userId) =>
  $.ajax({ url: `${BASE}/stats/user-activity/${userId}`, method: "GET" });

// Market
export const getMarketQuotes = () =>
  $.ajax({ url: `${BASE}/market/quotes`, method: "GET" });

export const getMarketHistory = (symbol, type, period) =>
  $.ajax({ url: `${BASE}/market/history`, method: "GET", data: { symbol, type, period } });
