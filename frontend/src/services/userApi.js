import api from './api';

export const userApi = {
  getUserProfile: async (username) => {
    const response = await api.get(`/users/${username}`);
    return response.data;
  },

  updateProfile: async (profileData) => {
    // profileData: { username, full_name, bio, website, gender, is_private }
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  updateProfileImage: async (imageUrl) => {
    const isShortUrl = typeof imageUrl === 'string' && imageUrl.length < 500 && !imageUrl.startsWith('data:');
    const response = await api.put(
      '/users/profile/image',
      { image_url: imageUrl },
      isShortUrl ? { params: { image_url: imageUrl } } : {}
    );
    return response.data;
  },

  deleteProfileImage: async () => {
    const response = await api.delete('/users/profile/image');
    return response.data;
  },

  getUserPosts: async (username) => {
    const response = await api.get(`/users/${username}/posts`);
    return response.data;
  },

  getUserReels: async (username) => {
    const response = await api.get(`/users/${username}/reels`);
    return response.data;
  },

  getSavedPosts: async () => {
    const response = await api.get('/users/saved');
    return response.data;
  },

  getSuggestions: async (limit = 5) => {
    const response = await api.get('/users/suggestions', {
      params: { limit },
    });
    return response.data;
  },

  searchUsers: async (keyword) => {
    const response = await api.get('/users/search', {
      params: { q: keyword },
    });
    return response.data;
  },
};

export default userApi;
