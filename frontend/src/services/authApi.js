import api from './api';

export const authApi = {
  login: async (credentials) => {
    // credentials: { username, password } or { username_or_email, password }
    const payload = {
      username_or_email: credentials.username_or_email || credentials.username || credentials.email,
      username: credentials.username || credentials.username_or_email,
      password: credentials.password,
    };
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  register: async (userData) => {
    // userData: { username, email, password, full_name }
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/password', {
      current_password: currentPassword,
      old_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  requestPasswordReset: async (username_or_email) => {
    const payload = typeof username_or_email === 'string'
      ? { username_or_email }
      : username_or_email;
    const response = await api.post('/auth/password/reset-request', payload);
    return response.data;
  },

  confirmPasswordReset: async ({ username_or_email, code, new_password }) => {
    const response = await api.post('/auth/password/reset-confirm', {
      username_or_email,
      code,
      new_password,
    });
    return response.data;
  },
};

export default authApi;

