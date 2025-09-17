import api from './api';

export const adminService = {
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  async getApprovedSalonsCount() {
    const response = await api.get('/admin/salons/count');
    return response.data;
  },

  async getAllSalons({ page = 1, search = '', limit = 10 }) {
    const response = await api.get('/admin/salons', {
      params: { page, search, limit }
    });
    return response.data;
  },

  async getAllSalonsDetails() {
    const response = await api.get('/admin/salons/all-details');
    return response.data;
  },

  async updateSalonStatus(salonId, data) {
    const response = await api.patch(`/admin/salons/${salonId}/status`, data);
    return response.data;
  },

  async deleteSalon(salonId) {
    const response = await api.delete(`/admin/salons/${salonId}`);
    return response.data;
  },

  async getPendingSalons() {
    console.log('=== ADMIN SERVICE: Calling /admin/salons/pending ===');
    const response = await api.get('/admin/salons/pending');
    console.log('=== ADMIN SERVICE: Raw response ===', response);
    console.log('=== ADMIN SERVICE: Response data ===', response.data);
    return response.data;
  },

  async approveSalon(salonId) {
    const response = await api.post(`/admin/salons/${salonId}/approve`);
    return response.data;
  },

  async rejectSalon(salonId, data) {
    const response = await api.post(`/admin/salons/${salonId}/reject`, data);
    return response.data;
  }
};