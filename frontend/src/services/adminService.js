import api from './api';

export const adminService = {
  // Dashboard
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  async getApprovedSalonsCount() {
    const response = await api.get('/admin/salons/count');
    return response.data;
  },

  // Salon Management
  async getAllSalons(params = {}) {
    const response = await api.get('/admin/salons', { params });
    return response.data;
  },

  async getAllSalonsDetails() {
    const response = await api.get('/admin/salons/all-details');
    return response.data;
  },

  async getPendingSalons(params = {}) {
    const response = await api.get('/admin/salons/pending', { params });
    return response.data;
  },

  async approveSalon(salonId) {
    const response = await api.post(`/admin/salons/${salonId}/approve`);
    return response.data;
  },

  async rejectSalon(salonId, reason) {
    const response = await api.post(`/admin/salons/${salonId}/reject`, { reason });
    return response.data;
  },

  async updateSalonStatus(salonId, statusData) {
    const response = await api.patch(`/admin/salons/${salonId}/status`, statusData);
    return response.data;
  },

  async deleteSalon(salonId) {
    const response = await api.delete(`/admin/salons/${salonId}`);
    return response.data;
  },

  // Staff Management
  async getAllStaff(params = {}) {
    const response = await api.get('/admin/staff', { params });
    return response.data;
  },

  async getPendingStaff() {
    const response = await api.get('/admin/staff/pending', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      params: {
        _t: Date.now() // Cache buster
      }
    });
    return response.data;
  },

  async approveStaff(staffId) {
    const response = await api.post(`/admin/staff/${staffId}/approve`);
    return response.data;
  },

  async rejectStaff(staffId, reason) {
    const response = await api.post(`/admin/staff/${staffId}/reject`, { reason });
    return response.data;
  },

  // Customer Management
  async getAllCustomers(params = {}) {
    const response = await api.get('/admin/customers', { params });
    return response.data;
  },

  // Appointment Management
  async getAllAppointments(params = {}) {
    const response = await api.get('/admin/appointments', { params });
    return response.data;
  },
};
