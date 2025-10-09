import api from './api';

export const salonService = {
  async register(userData) {
    const response = await api.post('/salon/register', userData);
    return response.data;
  },

  async updateDetails(id, details) {
    const response = await api.put(`/salon/details/${id}`, details);
    return response.data;
  },

  async setup(formData) {
    try {
      // Use axios directly to send multipart/form-data with auth header handled by interceptor
      const response = await api.post('/salon/setup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      // Enhanced error handling for salon setup
      console.error('Salon setup API error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to setup salon';
      throw new Error(message);
    }
  },

  async getDashboard(salonId) {
    const path = salonId ? `/salon/dashboard/${salonId}` : '/salon/dashboard';
    const response = await api.get(path);
    return response.data;
  },

  async getRevenueByService() {
    const response = await api.get('/salon/dashboard/revenue-by-service');
    return response.data?.data || [];
  },

  async getExpenseSummary() {
    const response = await api.get('/salon/expenses/summary');
    return response.data?.data || [];
  },

  async getExpenses({ page = 1, limit = 10, category, startDate, endDate } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (category) params.set('category', category);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const response = await api.get(`/salon/expenses?${params.toString()}`);
    return response.data;
  },

  async addExpense(expenseData) {
    const response = await api.post('/salon/expenses', expenseData);
    return response.data;
  },

  async updateExpense(expenseId, expenseData) {
    const response = await api.patch(`/salon/expenses/${expenseId}`, expenseData);
    return response.data;
  },

  async deleteExpense(expenseId) {
    const response = await api.delete(`/salon/expenses/${expenseId}`);
    return response.data;
  },

  async getServiceCategories() {
    const response = await api.get('/salon/dashboard/service-categories');
    return response.data?.data || [];
  },

  async getAppointments({ page = 1, limit = 5, status, date } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (status) params.set('status', status);
    if (date) params.set('date', date);
    const response = await api.get(`/salon/appointments?${params.toString()}`);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/salon/profile');
    return response.data;
  },

  async updateProfile(profileData) {
    // Check if we're sending FormData (for file uploads) or regular object
    if (profileData instanceof FormData) {
      // For file uploads, we need to let the browser set the Content-Type with boundary
      const response = await api.patch('/salon/profile', profileData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // For regular data, use JSON
      const response = await api.patch('/salon/profile', profileData);
      return response.data;
    }
  },

  async getSalonStaff() {
    const response = await api.get('/salon/staff');
    return response.data;
  },

  async getStaffAvailability({ startDate, endDate } = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const response = await api.get(`/salon/staff/availability?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching staff availability:', error);
      // Return a consistent error structure
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch staff availability',
        data: null
      };
    }
  },

  async assignStaffToAppointment(appointmentId, data) {
    // Use the salon-specific endpoint for assigning staff
    const response = await api.patch(`/salon/appointments/${appointmentId}`, data);
    return response.data;
  },

  async getStaffAppointments(staffId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/staff/appointments?staffId=${staffId}&${queryParams}`);
    return response.data;
  },

  async addService(serviceData) {
    const response = await api.post('/service', serviceData);
    return response.data;
  },

  async getServices({ page = 1, limit = 20, category, active, filter } = {}) {
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);
      if (category) params.set('category', category);
      if (active !== undefined) params.set('active', active);
      if (filter) params.set('filter', filter);
      const response = await api.get(`/service/my/services?${params.toString()}`);
      // Return the full response object, not just response.data
      return response;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  async getServiceCatalog(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/service/catalog${query ? `?${query}` : ''}`);
    return response.data;
  },

  async getServiceCategories() {
    const response = await api.get('/service/categories');
    return response.data;
  },

  async getServiceNamesByCategory(category) {
    const response = await api.get(`/service/service-names/${category}`);
    return response.data;
  },

  async getServiceTypesByName(name) {
    const response = await api.get(`/service/service-types/${name}`);
    return response.data;
  },

  async updateService(serviceId, serviceData) {
    const response = await api.patch(`/service/${serviceId}`, serviceData);
    return response.data;
  },

  async deleteService(serviceId) {
    const response = await api.delete(`/service/${serviceId}`);
    return response.data;
  },

  async updateAppointmentStatus(appointmentId, status, salonNotes = '') {
    const url = `/salon/appointments/${appointmentId}/status`;
    console.log('🔧 Making appointment status update request:', { url, appointmentId, status });
    console.log('🔧 Full URL will be:', `${api.defaults.baseURL}${url}`);
    const response = await api.patch(url, {
      status,
      salonNotes
    });
    return response.data;
  },

  async getNotifications(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        unreadOnly = false, 
        category = null,
        includeArchived = false,
        type = null
      } = options;

      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (unreadOnly) params.append('unreadOnly', 'true');
      if (category) params.append('category', category);
      if (includeArchived) params.append('includeArchived', 'true');
      if (type) params.append('type', type);

      console.log('📬 Fetching salon notifications with options:', options);
      const response = await api.get(`/salon/notifications?${params}`);
      
      if (response.data.success) {
        console.log(`✅ Retrieved ${response.data.data.notifications.length} notifications`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw error;
    }
  },

  async markNotificationAsRead(notificationId) {
    try {
      if (!notificationId) {
        throw new Error('Notification ID is required');
      }

      console.log(`📖 Marking notification as read: ${notificationId}`);
      const response = await api.put(`/salon/notifications/${notificationId}/read`);
      
      if (response.data.success) {
        console.log('✅ Notification marked as read successfully');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  },

  // Send reply to staff notification
  async sendReplyToStaff(notificationId, message) {
    try {
      if (!notificationId || !message) {
        throw new Error('Notification ID and message are required');
      }

      console.log(`📤 Sending reply to staff notification: ${notificationId}`);
      const response = await api.post(`/salon/notifications/${notificationId}/reply`, { message });
      
      if (response.data.success) {
        console.log('✅ Reply sent successfully');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to send reply');
      }
    } catch (error) {
      console.error('❌ Error sending reply:', error);
      throw error;
    }
  },

  // Send job offer to staff
  async sendJobOffer(offerData) {
    try {
      if (!offerData.staffId || !offerData.salary || !offerData.startDate) {
        throw new Error('Staff ID, salary, and start date are required');
      }

      console.log(`📤 Sending job offer to staff:`, offerData);
      const response = await api.post('/salon/job-offers', offerData);
      
      if (response.data.success) {
        console.log('✅ Job offer sent successfully');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to send job offer');
      }
    } catch (error) {
      console.error('❌ Error sending job offer:', error);
      throw error;
    }
  },

  // Reject staff application
  async rejectStaffApplication(notificationId) {
    try {
      if (!notificationId) {
        throw new Error('Notification ID is required');
      }

      console.log(`❌ Rejecting staff application: ${notificationId}`);
      const response = await api.put(`/salon/notifications/${notificationId}/reject`);
      
      if (response.data.success) {
        console.log('✅ Application rejected successfully');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to reject application');
      }
    } catch (error) {
      console.error('❌ Error rejecting application:', error);
      throw error;
    }
  },

  // Helper method to filter notifications by search term
  filterNotifications(notifications, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return notifications;
    }

    const term = searchTerm.toLowerCase().trim();
    return notifications.filter(notification => 
      notification.subject.toLowerCase().includes(term) ||
      notification.message.toLowerCase().includes(term) ||
      notification.staff?.name.toLowerCase().includes(term) ||
      notification.targetSkill.toLowerCase().includes(term)
    );
  },

  // Add the new schedule request methods
  async getPendingScheduleRequests() {
    const response = await api.get('/schedule-requests/pending');
    return response.data;
  },

  async approveScheduleRequest(requestId) {
    const response = await api.patch(`/schedule-requests/${requestId}/approve`);
    return response.data;
  },

  async rejectScheduleRequest(requestId, rejectionReason) {
    const response = await api.patch(`/schedule-requests/${requestId}/reject`, { rejectionReason });
    return response.data;
  }
};