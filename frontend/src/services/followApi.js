import api from './api';

export const followApi = {
  toggleFollow: async (userId) => {
    const response = await api.post(`/follows/${userId}`);
    return response.data; // { following: boolean, status: 'accepted' | 'pending' | null }
  },

  getFollowers: async (userId) => {
    const response = await api.get(`/users/${userId}/followers`);
    return response.data;
  },

  getFollowing: async (userId) => {
    const response = await api.get(`/users/${userId}/following`);
    return response.data;
  },

  getFollowRequests: async () => {
    const response = await api.get('/follows/requests');
    return response.data;
  },

  acceptFollowRequest: async (requesterId) => {
    const response = await api.post(`/follows/requests/${requesterId}/accept`);
    return response.data;
  },

  rejectFollowRequest: async (requesterId) => {
    const response = await api.post(`/follows/requests/${requesterId}/reject`);
    return response.data;
  },

  removeFollower: async (followerId) => {
    const response = await api.delete(`/follows/followers/${followerId}`);
    return response.data;
  },
};

export default followApi;
