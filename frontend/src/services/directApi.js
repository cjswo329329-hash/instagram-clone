import api from './api';

export const directApi = {
  getConversations: async () => {
    const response = await api.get('/direct/conversations');
    return response.data;
  },

  createConversation: async (targetUserId) => {
    const response = await api.post('/direct/conversations', {
      target_user_id: targetUserId,
    });
    return response.data;
  },

  getMessages: async (conversationId) => {
    const response = await api.get(`/direct/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId, text = null, mediaUrl = null) => {
    const response = await api.post(`/direct/conversations/${conversationId}/messages`, {
      text,
      media_url: mediaUrl,
    });
    return response.data;
  },

  markAsRead: async (conversationId) => {
    const response = await api.post(`/direct/conversations/${conversationId}/read`);
    return response.data;
  },

  toggleReaction: async (messageId, reaction = '❤️') => {
    const response = await api.post(`/direct/messages/${messageId}/reactions`, {
      reaction,
    });
    return response.data;
  },
};

export default directApi;
