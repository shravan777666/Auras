import api from './api';

export const freelancerService = {
  // Get freelancer dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/freelancer/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching freelancer dashboard stats:', error);
      throw error;
    }
  },

  // Get freelancer profile details
  getProfile: async () => {
    try {
      const response = await api.get('/freelancer/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching freelancer profile:', error);
      throw error;
    }
  },

  // Update freelancer profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/freelancer/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating freelancer profile:', error);
      throw error;
    }
  },

  // Get recent appointments
  getRecentAppointments: async () => {
    try {
      const response = await api.get('/freelancer/appointments/recent');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent appointments:', error);
      throw error;
    }
  },

  // Get all appointments
  getAppointments: async (params = {}) => {
    try {
      const response = await api.get('/freelancer/appointments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  // Update availability status
  updateAvailability: async (status) => {
    try {
      const response = await api.put('/freelancer/availability', { status });
      return response.data;
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  },

  // Get freelancer schedule
  getSchedule: async () => {
    try {
      const response = await api.get('/freelancer/schedule');
      return response.data;
    } catch (error) {
      console.error('Error fetching freelancer schedule:', error);
      throw error;
    }
  },

  // Update freelancer schedule
  updateSchedule: async (scheduleData) => {
    try {
      const response = await api.put('/freelancer/schedule', scheduleData);
      return response.data;
    } catch (error) {
      console.error('Error updating freelancer schedule:', error);
      throw error;
    }
  },

  // Get freelancer details by ID
  getFreelancerById: async (freelancerId) => {
    try {
      const response = await api.get(`/freelancer/${freelancerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching freelancer details:', error);
      throw error;
    }
  },

  // Get approved freelancers
  getApprovedFreelancers: async (params = {}) => {
    try {
      const response = await api.get('/freelancer/approved', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching approved freelancers:', error);
      throw error;
    }
  },

  // Get freelancer availability for a specific date
  getFreelancerAvailability: async (freelancerId, date) => {
    try {
      const response = await api.get(`/freelancer/${freelancerId}/availability?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching freelancer availability:', error);
      throw error;
    }
  },

  // Get freelancer services
  getFreelancerServices: async () => {
    try {
      const response = await api.get('/freelancer/services');
      return response.data;
    } catch (error) {
      console.error('Error fetching freelancer services:', error);
      throw error;
    }
  },

  // Add a new service for freelancer
  addFreelancerService: async (serviceData) => {
    try {
      const response = await api.post('/freelancer/services', serviceData);
      return response.data;
    } catch (error) {
      console.error('Error adding freelancer service:', error);
      throw error;
    }
  },

  // Update a freelancer service
  updateFreelancerService: async (serviceId, serviceData) => {
    try {
      const response = await api.put(`/freelancer/services/${serviceId}`, serviceData);
      return response.data;
    } catch (error) {
      console.error('Error updating freelancer service:', error);
      throw error;
    }
  },

  // Delete a freelancer service
  deleteFreelancerService: async (serviceId) => {
    try {
      const response = await api.delete(`/freelancer/services/${serviceId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting freelancer service:', error);
      throw error;
    }
  }
}

export default freelancerService;