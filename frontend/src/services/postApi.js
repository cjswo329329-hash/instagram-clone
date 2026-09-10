import api from './api';

export const postApi = {
  getFeed: async (limit = 10, cursor = null) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    const response = await api.get('/posts/feed', { params });
    return response.data;
  },

  getPostDetail: async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  createPost: async (postData) => {
    // postData: { caption, location, media_urls }
    const response = await api.post('/posts', postData);
    return response.data;
  },

  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  togglePostLike: async (postId) => {
    const response = await api.post(`/posts/${postId}/likes`);
    return response.data;
  },

  togglePostBookmark: async (postId) => {
    const response = await api.post(`/posts/${postId}/bookmarks`);
    return response.data;
  },

  getComments: async (postId) => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
  },

  addComment: async (postId, content, parentId = null) => {
    const payload = { content };
    if (parentId) payload.parent_id = parentId;
    const response = await api.post(`/posts/${postId}/comments`, payload);
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  toggleCommentLike: async (commentId) => {
    const response = await api.post(`/comments/${commentId}/likes`);
    return response.data;
  },
};

export default postApi;
