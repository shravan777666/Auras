import api from './api';

export const salonService = {
  async register(userData) {
    const response = await api.post('/salon/register', userData);
    return response.data;
  },

  async updateDetails(id, details) {
    const response = await api.put(`/salon/details/${id}`, details);
    return response.data;
  },

  async setup(formData) {
    try {
      // Use axios directly to send multipart/form-data with auth header handled by interceptor
      const response = await api.post('/salon/setup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      // Enhanced error handling for salon setup
      console.error('Salon setup API error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to setup salon';
      throw new Error(message);
    }
  },

  async getDashboard(salonId) {
    const path = salonId ? `/salon/dashboard/${salonId}` : '/salon/dashboard';
    const response = await api.get(path);
    return response.data;
  },

  async getRevenueByService() {
    const response = await api.get('/salon/dashboard/revenue-by-service');
    return response.data?.data || [];
  },

  async getServiceCategories() {
    const response = await api.get('/salon/dashboard/service-categories');
    return response.data?.data || [];
  },

  async getAppointments({ page = 1, limit = 5, status, date } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (status) params.set('status', status);
    if (date) params.set('date', date);
    const response = await api.get(`/salon/appointments?${params.toString()}`);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/salon/profile');
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.patch('/salon/profile', profileData);
    return response.data;
  },

  async getSalonStaff() {
    const response = await api.get('/salon/staff');
    return response.data;
  },

  async getStaffAvailability({ startDate, endDate } = {}) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const response = await api.get(`/salon/staff/availability?${params.toString()}`);
    return response.data;
  },

  async assignStaffToAppointment(appointmentId, data) {
    const response = await api.patch(`/appointment/${appointmentId}`, data);
    return response.data;
  },

  async getStaffAppointments(staffId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/staff/appointments?staffId=${staffId}&${queryParams}`);
    return response.data;
  },

  async addService(serviceData) {
    const response = await api.post('/salon/services', serviceData);
    return response.data;
  },

  async getServices({ page = 1, limit = 20, category, active } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (category) params.set('category', category);
    if (active !== undefined) params.set('active', active);
    const response = await api.get(`/salon/services?${params.toString()}`);
    return response.data;
  },

  async getServiceCatalog(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/service/catalog${query ? `?${query}` : ''}`);
    return response.data;
  },

  async updateAppointmentStatus(appointmentId, status, salonNotes = '') {
    const url = `/salon/appointments/${appointmentId}/status`;
    console.log('🔧 Making appointment status update request:', { url, appointmentId, status });
    console.log('🔧 Full URL will be:', `${api.defaults.baseURL}${url}`);
    const response = await api.patch(url, {
      status,
      salonNotes
    });
    return response.data;
  },
};