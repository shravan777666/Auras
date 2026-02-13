import api from './api';

export const queueService = {
  // Join the queue
  async joinQueue(customerId, serviceId, staffId = null) {
    const payload = { customerId, serviceId };
    if (staffId) {
      payload.staffId = staffId;
    }
    const response = await api.post('/queue/join', payload);
    return response.data;
  },

  // Get queue status for salon owner
  async getQueueStatus() {
    try {
      const response = await api.get('/queue/status');
      return response.data;
    } catch (error) {
      console.error('Error getting queue status:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch queue status',
        data: {
          currentService: null,
          upcomingTokens: [],
          totalWaiting: 0,
          completedTokens: []
        }
      };
    }
  },

  // Get all queue entries for salon owner
  async getQueue({ status, page = 1, limit = 10 }) {
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);
      if (status) params.set('status', status);
      
      const response = await api.get(`/queue?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting queue:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch queue',
        data: [],
        pagination: {
          current: page,
          pages: 0,
          total: 0
        }
      };
    }
  },

  // Update queue status (next, skip, complete)
  async updateQueueStatus(tokenNumber, action, staffId) {
    try {
      const response = await api.patch('/queue/status', { 
        tokenNumber, 
        action,
        staffId 
      });
      return response.data;
    } catch (error) {
      console.error('Error updating queue status:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update queue status',
        data: null
      };
    }
  },

  // Get queue by token number (for customer view)
  async getQueueByToken(tokenNumber) {
    const response = await api.get(`/queue/token/${tokenNumber}`);
    return response.data;
  },

  // Get queue status for customer view
  async getQueueStatusForCustomer(tokenNumber) {
    const response = await api.get(`/queue/customer/${tokenNumber}`);
    return response.data;
  },

  // Get salon queue status (public endpoint)
  async getSalonQueueStatus(salonId) {
    const response = await api.get(`/queue/salon/${salonId}`);
    return response.data;
  },

  // Check-in via QR code
  async checkInViaQR(tokenNumber) {
    try {
      const response = await api.post('/queue/checkin', { tokenNumber });
      return response.data;
    } catch (error) {
      console.error('Error checking in via QR:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to check in',
        data: null
      };
    }
  },
  
  // Appointment check-in via QR code (for salon join URLs)
  async appointmentCheckInViaQR(salonId) {
    try {
      const response = await api.post('/appointment/checkin', { salonId });
      return response.data;
    } catch (error) {
      console.error('Error checking in appointment via QR:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to check in appointment',
        data: null
      };
    }
  }
};

export default queueService;