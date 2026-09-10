import api from './api';

export const notificationApi = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
};

export default notificationApi;
