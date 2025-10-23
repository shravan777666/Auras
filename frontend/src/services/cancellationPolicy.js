import api from './api';

export const cancellationPolicyService = {
  // Get salon's cancellation policy
  async getPolicy(salonId) {
    const response = await api.get(`/cancellation-policy/${salonId}`);
    return response.data;
  },

  // Create/update salon's cancellation policy (salon owner only)
  async createOrUpdatePolicy(policyData) {
    const response = await api.post('/cancellation-policy', policyData);
    return response.data;
  },

  // Get all cancellation policies for salon owner
  async getOwnerPolicies() {
    const response = await api.get('/cancellation-policy');
    return response.data;
  }
};

export default cancellationPolicyService;