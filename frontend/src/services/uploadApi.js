import api from './api';

export const uploadApi = {
  uploadMedia: async (file, category = 'posts') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await api.post('/uploads/media', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return response.data; // { url, filename, media_type }
  },
};

export default uploadApi;
