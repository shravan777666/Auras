import api from './api';

export const recommendationService = {
  // Get recent clients who have taken appointments
  async getRecentClients() {
    const response = await api.get('/recommendations/recent');
    return response.data;
  },

  // Get all clients
  async getClients() {
    const response = await api.get('/recommendations/clients');
    return response.data;
  },

  // Get recommendations for a specific client
  async getClientRecommendations(clientId) {
    const response = await api.get(`/recommendations/client/${clientId}`);
    return response.data;
  },

  // Send recommendations to a client
  async sendRecommendations(clientId, recommendations) {
    const response = await api.post('/recommendations/send', {
      clientId,
      recommendations
    });
    return response.data;
  }
};