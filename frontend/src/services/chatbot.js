import api from './api';

export const chatbotService = {
  /**
   * Send a message to the chatbot
   * @param {string} message - User message
   * @param {string} action - Action to perform
   * @param {object} data - Additional data for the action
   */
  async sendMessage(message, action = null, data = null) {
    try {
      const payload = {};
      
      if (message) payload.message = message;
      if (action) payload.action = action;
      if (data) payload.data = data;
      
      const response = await api.post('/chatbot/message', payload);
      return response.data;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  },

  /**
   * Get conversation history
   */
  async getHistory() {
    try {
      const response = await api.get('/chatbot/history');
      return response.data;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  },

  /**
   * Reset chat session
   */
  async resetSession() {
    try {
      const response = await api.post('/chatbot/reset');
      return response.data;
    } catch (error) {
      console.error('Error resetting chat session:', error);
      throw error;
    }
  }
};
