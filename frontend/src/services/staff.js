import api from './api';

export const getStaffById = async (id) => {
  try {
    const response = await api.get(`/staff/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching staff with id ${id}:`, error);
    throw error;
  }
};

export const updateStaffById = async (id, data) => {
  try {
    const response = await api.put(`/staff/${id}`, data);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating staff with id ${id}:`, error);
    throw error;
  }
};

export const getAppointmentsByStaffId = async (id, params = {}) => {
  try {
    const response = await api.get(`/staff/${id}/appointments`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching appointments for staff ${id}:`, error);
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get('/staff/profile');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching staff profile:', error);
    throw error;
  }
};

export const updateProfile = async (data) => {
  try {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await api.put('/staff/profile', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error updating staff profile:', error);
    throw error;
  }
};

export const staffService = {
  async register(userData) {
    const response = await api.post('/staff/register', userData);
    return response.data;
  },

  async createStaff(staffData) {
    const isFormData = typeof FormData !== 'undefined' && staffData instanceof FormData;
    const response = await api.post('/staff/create', staffData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
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

  async getProfile() {
    const response = await api.get('/staff/profile');
    return response.data;
  },

  async updateProfile(data) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await api.put('/staff/profile', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  async getAppointments(params = {}) {
    const response = await api.get('/staff/appointments', { params });
    return response.data;
  },

  async getUpcomingAppointments(params = {}) {
    const response = await api.get('/staff/upcoming-appointments', { params });
    return response.data;
  },

  async getCompletedAppointments(params = {}) {
    const response = await api.get('/staff/completed-appointments', { params });
    return response.data;
  },
  
  async getStaffReport() {
    const response = await api.get('/staff/report');
    return response.data;
  },
};