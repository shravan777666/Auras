import { api } from './api';

class CustomerMessageService {
  // Get all conversations for customer
  async getConversations() {
    try {
      const response = await api.get('/customer/messages/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get specific conversation messages
  async getConversationMessages(salonId, params = {}) {
    try {
      const response = await api.get(`/customer/messages/conversations/${salonId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      throw error;
    }
  }

  // Send message to salon
  async sendMessage(salonId, messageData) {
    try {
      const response = await api.post(`/customer/messages/conversations/${salonId}`, messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId) {
    try {
      const response = await api.put(`/customer/messages/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount() {
    try {
      const response = await api.get('/customer/messages/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // Get message notifications
  async getNotifications(params = {}) {
    try {
      const response = await api.get('/customer/messages/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Helper method to format message timestamp
  formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  // Helper method to format detailed timestamp
  formatDetailedTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Helper method to truncate message content
  truncateMessage(content, maxLength = 50) {
    if (!content) return '';
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  }
}

export const customerMessageService = new CustomerMessageService();
export default customerMessageService;
