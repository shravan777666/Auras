import api from './api';

export const loyaltyService = {
  // Redeem loyalty points for an appointment
  async redeemPoints(customerId, pointsToRedeem, appointmentId) {
    try {
      const response = await api.post('/loyalty/customer/redeem', {
        customerId,
        pointsToRedeem,
        appointmentId
      });
      return response.data;
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  },

  // Get customer loyalty details
  async getCustomerLoyaltyDetails(customerId) {
    try {
      const response = await api.get(`/loyalty/customer/${customerId}/details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer loyalty details:', error);
      throw error;
    }
  },

  // Get loyalty dashboard metrics for salon owners
  async getLoyaltyDashboardMetrics() {
    try {
      const response = await api.get('/loyalty/salon/dashboard-metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty dashboard metrics:', error);
      throw error;
    }
  },

  // Get top loyalty customers
  async getTopLoyaltyCustomers(limit = 5) {
    try {
      const response = await api.get(`/loyalty/salon/top-customers?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top loyalty customers:', error);
      throw error;
    }
  }
};

export default loyaltyService;