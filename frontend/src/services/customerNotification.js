import api from './api';

export const customerNotificationService = {
  // Get customer notifications
  async getNotifications(options = {}) {
    const { page = 1, limit = 20, unreadOnly = false, category = null, includeArchived = false } = options;
    
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (unreadOnly) params.append('unreadOnly', unreadOnly);
    if (category) params.append('category', category);
    if (includeArchived) params.append('includeArchived', includeArchived);
    
    const response = await api.get(`/customer/notifications?${params.toString()}`);
    return response.data;
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    const response = await api.put(`/customer/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds) {
    const response = await api.put('/customer/notifications/read', { notificationIds });
    return response.data;
  }
};

export default customerNotificationService;