import api from './api';
import { toast } from 'react-hot-toast';

export const scheduleRequestService = {
  // Create a block time request
  async createBlockTimeRequest(data) {
    try {
      const response = await api.post('/schedule-requests/block-time', data);
      return response.data;
    } catch (error) {
      console.error('Error creating block time request:', error);
      throw error;
    }
  },

  // Create a leave request
  async createLeaveRequest(data) {
    try {
      const response = await api.post('/schedule-requests/leave', data);
      return response.data;
    } catch (error) {
      console.error('Error creating leave request:', error);
      throw error;
    }
  },

  // Create a shift swap request
  async createShiftSwapRequest(data) {
    try {
      const response = await api.post('/schedule-requests/shift-swap', data);
      return response.data;
    } catch (error) {
      console.error('Error creating shift swap request:', error);
      throw error;
    }
  },

  // Get my requests
  async getMyRequests(params = {}) {
    try {
      const response = await api.get('/schedule-requests/my-requests', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching my requests:', error);
      throw error;
    }
  },

  // Get pending requests for owner
  async getPendingRequests(params = {}) {
    try {
      const response = await api.get('/schedule-requests/pending', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending requests:', error.response?.data || error.message || error);
      // Re-throw the error so the calling component can handle it
      throw error;
    }
  },

  // Approve a request
  async approveRequest(id) {
    try {
      const response = await api.patch(`/schedule-requests/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  },

  // Reject a request
  async rejectRequest(id, rejectionReason) {
    try {
      const response = await api.patch(`/schedule-requests/${id}/reject`, { rejectionReason });
      return response.data;
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }
};