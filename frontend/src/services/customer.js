import api from './api';

export const customerService = {
  async getDashboard() {
    const response = await api.get('/customer/dashboard');
    return response.data;
  },
};