const { getClient } = require('./client');
const { wrap } = require('./compat');

const c = () => getClient();

// ─── Auth ────────────────────────────────────────────────────────────────────

const login = (username, password) =>
  wrap(c().post('/auth/login', { username, password }));

const register = (payload) =>
  wrap(c().post('/auth/register', payload));

const getMe = () =>
  wrap(c().get('/auth/me'));

// ─── Posts ───────────────────────────────────────────────────────────────────

const getFeed = () =>
  wrap(c().get('/posts/feed'));

const createPost = (payload) =>
  wrap(c().post('/posts', payload));

const updatePost = (id, payload) =>
  wrap(c().put(`/posts/${id}`, payload));

const deletePost = (id) =>
  wrap(c().delete(`/posts/${id}`));

const toggleLike = (id) =>
  wrap(c().post(`/posts/${id}/like`));

const addComment = (id, text) =>
  wrap(c().post(`/posts/${id}/comments`, { text }));

const getUserPosts = (userId) =>
  wrap(c().get(`/posts/user/${userId}`));

const getGroupPosts = (groupId) =>
  wrap(c().get(`/posts/group/${groupId}`));

const searchPosts = (params) =>
  wrap(c().get('/posts/search', { params }));

const uploadMedia = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return wrap(c().post('/posts/upload', formData));
};

// ─── Groups ──────────────────────────────────────────────────────────────────

const listGroups = (params = {}) =>
  wrap(c().get('/groups', { params }));

const getGroup = (id) =>
  wrap(c().get(`/groups/${id}`));

const createGroup = (payload) =>
  wrap(c().post('/groups', payload));

const updateGroup = (id, payload) =>
  wrap(c().put(`/groups/${id}`, payload));

const deleteGroup = (id) =>
  wrap(c().delete(`/groups/${id}`));

const joinGroup = (id) =>
  wrap(c().post(`/groups/${id}/join`));

const approveJoin = (groupId, userId) =>
  wrap(c().post(`/groups/${groupId}/approve/${userId}`));

const removeMember = (groupId, userId) =>
  wrap(c().delete(`/groups/${groupId}/members/${userId}`));

const searchGroups = (params) =>
  wrap(c().get('/groups/search', { params }));

// ─── Users ───────────────────────────────────────────────────────────────────

const listUsers = (params = {}) =>
  wrap(c().get('/users', { params }));

const getUser = (id) =>
  wrap(c().get(`/users/${id}`));

const updateProfile = (id, payload) =>
  wrap(c().put(`/users/${id}`, payload));

const sendFriendRequest = (id) =>
  wrap(c().post(`/users/${id}/friend-request`));

const acceptFriendRequest = (requesterId) =>
  wrap(c().post(`/users/friend-request/${requesterId}/accept`));

// ─── Messages ────────────────────────────────────────────────────────────────

const getInbox = () =>
  wrap(c().get('/messages'));

const getConversation = (otherUserId) =>
  wrap(c().get(`/messages/${otherUserId}`));

// ─── Stats ───────────────────────────────────────────────────────────────────

const getPostsPerMonth = (params = {}) =>
  wrap(c().get('/stats/posts-per-month', { params }));

const getTopGroups = (params = {}) =>
  wrap(c().get('/stats/top-groups', { params }));

const getUserActivity = (userId) =>
  wrap(c().get(`/stats/user-activity/${userId}`));

// ─── Market ──────────────────────────────────────────────────────────────────

const getMarketQuotes = () =>
  wrap(c().get('/market/quotes'));

const getMarketHistory = (symbol, type, period) =>
  wrap(c().get('/market/history', { params: { symbol, type, period } }));

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  login, register, getMe,
  getFeed, createPost, updatePost, deletePost, toggleLike, addComment,
  getUserPosts, getGroupPosts, searchPosts, uploadMedia,
  listGroups, getGroup, createGroup, updateGroup, deleteGroup,
  joinGroup, approveJoin, removeMember, searchGroups,
  listUsers, getUser, updateProfile, sendFriendRequest, acceptFriendRequest,
  getInbox, getConversation,
  getPostsPerMonth, getTopGroups, getUserActivity,
  getMarketQuotes, getMarketHistory,
};
