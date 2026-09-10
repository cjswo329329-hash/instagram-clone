import api from './api';

export const exploreApi = {
  getExplore: async (query = '', limit = 24, offset = 0) => {
    const params = { limit, offset };
    if (query && query.trim()) {
      params.q = query.trim();
    }
    const response = await api.get('/explore', { params });
    return response.data;
  },
};

export default exploreApi;
