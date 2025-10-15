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
      // Show a more user-friendly error message
      const errorMessage = error.response?.data?.message || 'Failed to submit shift swap request. Please try again.';
      toast.error(errorMessage);
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

  // Get peer shift swap requests (for target staff to review)
  async getPeerShiftSwapRequests(params = {}) {
    try {
      const response = await api.get('/schedule-requests/peer-shift-swaps', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching peer shift swap requests:', error);
      throw error;
    }
  },

  // Peer approve a shift swap request
  async peerApproveShiftSwap(id) {
    try {
      const response = await api.patch(`/schedule-requests/${id}/peer-approve`);
      return response.data;
    } catch (error) {
      console.error('Error peer approving shift swap request:', error);
      throw error;
    }
  },

  // Peer reject a shift swap request
  async peerRejectShiftSwap(id, rejectionReason) {
    try {
      const response = await api.patch(`/schedule-requests/${id}/peer-reject`, { rejectionReason });
      return response.data;
    } catch (error) {
      console.error('Error peer rejecting shift swap request:', error);
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