import { api } from "./client";

export const usersApi = {
  list: (params) => api.get("/users", { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (body) => api.post("/users", body),
  update: (id, b) => api.patch(`/users/${id}`, b),
  remove: (id) => api.delete(`/users/${id}`),
  follow: (id, t) => api.post(`/users/${id}/follow/${t}`),
  unfollow: (id, t) => api.delete(`/users/${id}/follow/${t}`),
  block: (id, t) => api.post(`/users/${id}/block/${t}`),
  unblock: (id, t) => api.delete(`/users/${id}/block/${t}`),
  joinGroup: (id, g) => api.post(`/users/${id}/join/${g}`),
  leaveGroup: (id, g) => api.delete(`/users/${id}/join/${g}`),
  feed: (id) => api.get(`/users/${id}/feed`),
  followers: (id) => api.get(`/users/${id}/followers`),
  following: (id) => api.get(`/users/${id}/following`),
};

export const postsApi = {
  list: (params) => api.get("/posts", { params }),
  get: (id) => api.get(`/posts/${id}`),
  create: (body) => api.post("/posts", body),
  update: (id, b) => api.patch(`/posts/${id}`, b),
  remove: (id) => api.delete(`/posts/${id}`),
  like: (id, userId) => api.post(`/posts/${id}/like`, { userId }),
  unlike: (id, userId) => api.delete(`/posts/${id}/like`, { data: { userId } }),
  comments: (id) => api.get(`/posts/${id}/comments`),
  tag: (id, h) => api.post(`/posts/${id}/tag/${h}`),
  save: (id, userId) => api.post(`/posts/${id}/save`, { userId }),
  share: (id, g) => api.post(`/posts/${id}/share/${g}`),
  checkLiked: (postId, userId) => api.get(`/posts/${postId}/liked-by/${userId}`),
  media: (id) => api.get(`/posts/${id}/media`),
  author: (id) => api.get(`/posts/${id}/author`),
  feedWithAuthors: (uid, limit = 20) => api.get(`/posts/feed-with-authors/${uid}`, { params: { limit } }),
  recentWithAuthors: (limit = 20) => api.get(`/posts/recent-with-authors`, { params: { limit } }),
};

export const commentsApi = {
  list: (params) => api.get("/comments", { params }),
  get: (id) => api.get(`/comments/${id}`),
  create: (body) => api.post("/comments", body),
  update: (id, b) => api.patch(`/comments/${id}`, b),
  remove: (id) => api.delete(`/comments/${id}`),
  reply: (id, b) => api.post(`/comments/${id}/reply`, b),
};

export const hashtagsApi = {
  list: (params) => api.get("/hashtags", { params }),
  get: (name) => api.get(`/hashtags/${name}`),
  create: (body) => api.post("/hashtags", body),
  update: (n, b) => api.patch(`/hashtags/${n}`, b),
  remove: (n) => api.delete(`/hashtags/${n}`),
  posts: (n) => api.get(`/hashtags/${n}/posts`),
};

export const groupsApi = {
  list: (params) => api.get("/groups", { params }),
  get: (id) => api.get(`/groups/${id}`),
  create: (body) => api.post("/groups", body),
  update: (id, b) => api.patch(`/groups/${id}`, b),
  remove: (id) => api.delete(`/groups/${id}`),
  members: (id) => api.get(`/groups/${id}/members`),
  posts: (id) => api.get(`/groups/${id}/posts`),
};

export const messagesApi = {
  list: (params) => api.get("/messages", { params }),
  get: (id) => api.get(`/messages/${id}`),
  create: (body) => api.post("/messages", body),
  update: (id, b) => api.patch(`/messages/${id}`, b),
  remove: (id) => api.delete(`/messages/${id}`),
  sent: (uid) => api.get(`/messages/sent/${uid}`),
  received: (uid) => api.get(`/messages/received/${uid}`),
};

export const mediaApi = {
  list: (params) => api.get("/media", { params }),
  get: (id) => api.get(`/media/${id}`),
  create: (body) => api.post("/media", body),
  update: (id, b) => api.patch(`/media/${id}`, b),
  remove: (id) => api.delete(`/media/${id}`),
  attachToPost: (id, p) => api.post(`/media/${id}/attach/post/${p}`),
  attachToMessage: (id, m) => api.post(`/media/${id}/attach/message/${m}`),
};

export const notificationsApi = {
  list: (params) => api.get("/notifications", { params }),
  get: (id) => api.get(`/notifications/${id}`),
  create: (body) => api.post("/notifications", body),
  update: (id, b) => api.patch(`/notifications/${id}`, b),
  remove: (id) => api.delete(`/notifications/${id}`),
  about: (id) => api.get(`/notifications/${id}/about`),
};

export const healthApi = () => api.get("/health");
