import { api } from './api';

class StaffNotificationService {
  // Get notifications for the logged-in staff member
  async getNotifications(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        unreadOnly = false, 
        category = null,
        includeArchived = false 
      } = options;

      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (unreadOnly) params.append('unreadOnly', 'true');
      if (category) params.append('category', category);
      if (includeArchived) params.append('includeArchived', 'true');

      console.log('📬 Fetching staff notifications with options:', options);
      const response = await api.get(`/staff/notifications?${params}`);
      
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
  }

  // Mark a single notification as read
  async markAsRead(notificationId) {
    try {
      if (!notificationId) {
        throw new Error('Notification ID is required');
      }

      console.log(`📖 Marking notification as read: ${notificationId}`);
      const response = await api.put(`/staff/notifications/${notificationId}/read`);
      
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
  }

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds) {
    try {
      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new Error('Notification IDs array is required');
      }

      console.log(`📖 Marking ${notificationIds.length} notifications as read`);
      const response = await api.put('/staff/notifications/mark-read', {
        notificationIds
      });
      
      if (response.data.success) {
        console.log(`✅ ${response.data.data.markedCount} notifications marked as read`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to mark notifications as read');
      }
    } catch (error) {
      console.error('❌ Error marking multiple notifications as read:', error);
      throw error;
    }
  }

  // Archive a notification
  async archiveNotification(notificationId) {
    try {
      if (!notificationId) {
        throw new Error('Notification ID is required');
      }

      console.log(`🗄️ Archiving notification: ${notificationId}`);
      const response = await api.put(`/staff/notifications/${notificationId}/archive`);
      
      if (response.data.success) {
        console.log('✅ Notification archived successfully');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to archive notification');
      }
    } catch (error) {
      console.error('❌ Error archiving notification:', error);
      throw error;
    }
  }

  // Send a reply to a notification
  async sendReply(replyData) {
    try {
      if (!replyData.message || !replyData.recipient || !replyData.originalMessageId) {
        throw new Error('Message, recipient, and originalMessageId are required');
      }

      console.log('📤 Sending reply to notification:', replyData);
      const response = await api.post('/staff/notifications/reply', replyData);
      
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
  }

  // Helper method to format notification data for display
  formatNotificationData(notification) {
    return {
      ...notification,
      formattedSentAt: this.formatDate(notification.sentAt),
      formattedReadAt: notification.readAt ? this.formatDate(notification.readAt) : null,
      categoryColor: this.getCategoryColor(notification.category),
      priorityColor: this.getPriorityColor(notification.priority),
      statusIcon: this.getStatusIcon(notification),
      timeAgo: this.getTimeAgo(notification.sentAt)
    };
  }

  // Helper method to format dates
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Helper method to get time ago
  getTimeAgo(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
  }

  // Helper method to get category color
  getCategoryColor(category) {
    switch (category) {
      case 'opportunity':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'announcement':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'training':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'event':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'general':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // Helper method to get priority color
  getPriorityColor(priority) {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // Helper method to get status icon
  getStatusIcon(notification) {
    if (notification.isArchived) {
      return 'archive';
    } else if (notification.isRead) {
      return 'check-circle';
    } else {
      return 'mail';
    }
  }

  // Helper method to get category display name
  getCategoryDisplayName(category) {
    const categoryMap = {
      'opportunity': 'Job Opportunity',
      'announcement': 'Announcement',
      'training': 'Training',
      'event': 'Event',
      'general': 'General'
    };
    return categoryMap[category] || category;
  }

  // Helper method to get priority display name
  getPriorityDisplayName(priority) {
    const priorityMap = {
      'urgent': 'Urgent',
      'high': 'High Priority',
      'medium': 'Medium Priority',
      'low': 'Low Priority'
    };
    return priorityMap[priority] || priority;
  }

  // Helper method to get available categories for filtering
  getAvailableCategories() {
    return [
      { value: '', label: 'All Categories' },
      { value: 'opportunity', label: 'Job Opportunities' },
      { value: 'announcement', label: 'Announcements' },
      { value: 'training', label: 'Training' },
      { value: 'event', label: 'Events' },
      { value: 'general', label: 'General' }
    ];
  }

  // Helper method to filter notifications by search term
  filterNotifications(notifications, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return notifications;
    }

    const term = searchTerm.toLowerCase().trim();
    return notifications.filter(notification => 
      notification.subject.toLowerCase().includes(term) ||
      notification.message.toLowerCase().includes(term) ||
      notification.sender.salonName.toLowerCase().includes(term) ||
      notification.targetSkill.toLowerCase().includes(term)
    );
  }

  // Helper method to sort notifications
  sortNotifications(notifications, sortBy = 'sentAt', sortOrder = 'desc') {
    return [...notifications].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date sorting
      if (sortBy === 'sentAt' || sortBy === 'readAt') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
}

// Create and export service instance
export const staffNotificationService = new StaffNotificationService();
export default staffNotificationService;