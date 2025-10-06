import api from './api';

class AlertsService {
  // Get needs attention alerts for salon owner dashboard
  async getNeedsAttentionAlerts() {
    try {
      const response = await api.get('/alerts/needs-attention');
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }
}

export const alertsService = new AlertsService();
export default alertsService;