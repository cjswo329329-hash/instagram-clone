import api from './api';

export const storyApi = {
  getStoriesFeed: async () => {
    const response = await api.get('/stories/feed');
    return response.data;
  },

  createStory: async (mediaUrl, mediaType = 'image') => {
    const response = await api.post('/stories', {
      media_url: mediaUrl,
      media_type: mediaType,
    });
    return response.data;
  },

  viewStory: async (storyId) => {
    const response = await api.post(`/stories/${storyId}/view`);
    return response.data;
  },

  getUserHighlights: async (username) => {
    const response = await api.get(`/users/${username}/highlights`);
    return response.data;
  },
};

export default storyApi;
