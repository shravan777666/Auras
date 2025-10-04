import { api } from './api';

class BroadcastService {
  // Get all unique skills from staff profiles
  async getAllSkills() {
    try {
      console.log('🔍 Fetching all available skills...');
      const response = await api.get('/broadcast/skills');
      
      if (response.data.success) {
        console.log(`✅ Found ${response.data.data.skills.length} unique skills`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch skills');
      }
    } catch (error) {
      console.error('❌ Error fetching skills:', error);
      throw error;
    }
  }

  // Get target count for a specific skill
  async getTargetCount(skill) {
    try {
      if (!skill) {
        throw new Error('Skill parameter is required');
      }

      console.log(`🎯 Getting target count for skill: "${skill}"`);
      const response = await api.get(`/broadcast/target-count?skill=${encodeURIComponent(skill)}`);
      
      if (response.data.success) {
        console.log(`📊 Target count for "${skill}": ${response.data.data.targetCount} staff members`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to get target count');
      }
    } catch (error) {
      console.error('❌ Error getting target count:', error);
      throw error;
    }
  }

  // Send broadcast to staff with specific skill
  async sendBroadcast(broadcastData) {
    try {
      const { subject, message, targetSkill, category = 'general', priority = 'medium' } = broadcastData;

      // Validation
      if (!subject || !message || !targetSkill) {
        throw new Error('Subject, message, and target skill are required');
      }

      if (subject.length > 200) {
        throw new Error('Subject must be 200 characters or less');
      }

      if (message.length > 2000) {
        throw new Error('Message must be 2000 characters or less');
      }

      console.log(`📢 Sending broadcast to staff with "${targetSkill}" skill...`);
      const response = await api.post('/broadcast/send', {
        subject,
        message,
        targetSkill,
        category,
        priority
      });
      
      if (response.data.success) {
        console.log(`✅ Broadcast sent successfully to ${response.data.data.deliveredCount} staff members`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to send broadcast');
      }
    } catch (error) {
      console.error('❌ Error sending broadcast:', error);
      throw error;
    }
  }

  // Get broadcast history for the salon
  async getBroadcastHistory(options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      console.log(`📋 Fetching broadcast history (page ${page})...`);
      const response = await api.get(`/broadcast/history?page=${page}&limit=${limit}`);
      
      if (response.data.success) {
        console.log(`✅ Retrieved ${response.data.data.broadcasts.length} broadcasts`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch broadcast history');
      }
    } catch (error) {
      console.error('❌ Error fetching broadcast history:', error);
      throw error;
    }
  }

  // Get broadcast analytics
  async getBroadcastAnalytics(timeframe = 30) {
    try {
      console.log(`📈 Fetching broadcast analytics for last ${timeframe} days...`);
      const response = await api.get(`/broadcast/analytics?timeframe=${timeframe}`);
      
      if (response.data.success) {
        console.log('✅ Analytics retrieved successfully');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      throw error;
    }
  }

  // Get detailed broadcast information
  async getBroadcastDetails(broadcastId) {
    try {
      if (!broadcastId) {
        throw new Error('Broadcast ID is required');
      }

      console.log(`🔍 Fetching details for broadcast: ${broadcastId}`);
      const response = await api.get(`/broadcast/${broadcastId}`);
      
      if (response.data.success) {
        console.log('✅ Broadcast details retrieved successfully');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch broadcast details');
      }
    } catch (error) {
      console.error('❌ Error fetching broadcast details:', error);
      throw error;
    }
  }

  // Helper method to format broadcast data for display
  formatBroadcastData(broadcast) {
    return {
      ...broadcast,
      formattedSentAt: this.formatDate(broadcast.sentAt),
      formattedCreatedAt: this.formatDate(broadcast.createdAt),
      deliveryRateText: `${broadcast.deliveryRate}%`,
      readRateText: `${broadcast.readRate}%`,
      statusColor: this.getStatusColor(broadcast.status),
      priorityColor: this.getPriorityColor(broadcast.priority)
    };
  }

  // Helper method to format dates
  formatDate(dateString) {
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

  // Helper method to get status color
  getStatusColor(status) {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Helper method to get priority color
  getPriorityColor(priority) {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Helper method to validate broadcast data
  validateBroadcastData(data) {
    const errors = [];

    if (!data.subject || data.subject.trim().length === 0) {
      errors.push('Subject is required');
    } else if (data.subject.length > 200) {
      errors.push('Subject must be 200 characters or less');
    }

    if (!data.message || data.message.trim().length === 0) {
      errors.push('Message is required');
    } else if (data.message.length > 2000) {
      errors.push('Message must be 2000 characters or less');
    }

    if (!data.targetSkill || data.targetSkill.trim().length === 0) {
      errors.push('Target skill is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper method to get available categories
  getAvailableCategories() {
    return [
      { value: 'general', label: 'General', description: 'General announcements and updates' },
      { value: 'opportunity', label: 'Job Opportunity', description: 'Job openings and freelance opportunities' },
      { value: 'announcement', label: 'Announcement', description: 'Important announcements' },
      { value: 'training', label: 'Training', description: 'Training sessions and workshops' },
      { value: 'event', label: 'Event', description: 'Events and networking opportunities' }
    ];
  }

  // Helper method to get available priorities
  getAvailablePriorities() {
    return [
      { value: 'low', label: 'Low', description: 'Non-urgent information' },
      { value: 'medium', label: 'Medium', description: 'Standard priority' },
      { value: 'high', label: 'High', description: 'Important information' },
      { value: 'urgent', label: 'Urgent', description: 'Requires immediate attention' }
    ];
  }
}

// Create and export service instance
export const broadcastService = new BroadcastService();
export default broadcastService;
