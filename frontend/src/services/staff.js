import api from './api';

export const staffService = {
  async register(userData) {
    const response = await api.post('/staff/register', userData);
    return response.data;
  },

  async createStaff(staffData) {
    const response = await api.post('/staff/create', staffData);
    return response.data;
  },

  async updateDetails(id, details) {
    const response = await api.put(`/staff/details/${id}`, details);
    return response.data;
  },

  async setup(profileData) {
    const response = await api.post('/staff/setup', profileData);
    return response.data;
  },

  async getDashboardData() {
    const response = await api.get('/staff/dashboard');
    return response.data;
  },

  async getAppointments(params = {}) {
    const response = await api.get('/staff/appointments', { params });
    return response.data;
  },
};