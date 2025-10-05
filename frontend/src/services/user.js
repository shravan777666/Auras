import api from './api';

export const userService = {
  async searchUsers(query) {
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
};