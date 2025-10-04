import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Mail, 
  MailOpen,
  Filter, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Archive,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Inbox,
  AlertCircle,
  Reply,
  Clock,
  User,
  Target,
  UserPlus,
  XCircle,
  Check
} from 'lucide-react';
import { salonService } from '../../services/salon';
import HireStaffModal from '../../components/salon/HireStaffModal';
import NotificationReply from '../../components/salon/NotificationReply';

const SalonNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    unreadOnly: false,
    includeArchived: false,
    type: '' // direct_message, broadcast, etc.
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    readRate: 0
  });

  const [showFilters, setShowFilters] = useState(false);
  
  // State for modals and reply functionality
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState({}); // Track status of notifications

  // Load notifications
  const loadNotifications = async (page = 1, newFilters = filters) => {
    try {
      setRefreshing(true);
      setError(null);

      const options = {
        page,
        limit: pagination.limit,
        unreadOnly: newFilters.unreadOnly,
        category: newFilters.category || null,
        includeArchived: newFilters.includeArchived,
        type: newFilters.type || null
      };

      console.log('🔄 Loading salon notifications with options:', options);
      const response = await salonService.getNotifications(options);

      if (response.success) {
        let notificationList = response.data.notifications || [];
        
        // Apply client-side search filter
        if (newFilters.search) {
          notificationList = salonService.filterNotifications(
            notificationList, 
            newFilters.search
          );
        }

        setNotifications(notificationList);
        setPagination(response.data.pagination || pagination);

        // Update stats from response
        if (response.data.pagination?.total !== undefined && response.data.unreadCount !== undefined) {
          const total = response.data.pagination.total;
          const unread = response.data.unreadCount;
          const read = total - unread;
          const readRate = total > 0 ? Math.round((read / total) * 100) : 0;

          setStats({
            total,
            unread,
            read,
            readRate
          });
        }

        console.log(`✅ Loaded ${notificationList.length} notifications`);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError(error.message || 'Failed to load notifications');
      toast.error('Failed to load notifications');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadNotifications(1, newFilters);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadNotifications(1, filters);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadNotifications(newPage, filters);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadNotifications(pagination.page, filters);
  };

  // Handle notification update
  const handleNotificationUpdate = () => {
    loadNotifications(pagination.page, filters);
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await salonService.markNotificationAsRead(notificationId);
      toast.success('Notification marked as read');
      handleNotificationUpdate();
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.isRead)
        .map(n => n.id);

      if (unreadIds.length === 0) {
        toast.info('No unread notifications to mark');
        return;
      }

      // For now, we'll mark each one individually since there's no bulk endpoint
      const promises = unreadIds.map(id => salonService.markNotificationAsRead(id));
      await Promise.all(promises);
      
      toast.success(`Marked ${unreadIds.length} notifications as read`);
      handleNotificationUpdate();
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      unreadOnly: false,
      includeArchived: false,
      type: ''
    };
    setFilters(clearedFilters);
    loadNotifications(1, clearedFilters);
  };

  // Get category display name
  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      'opportunity': 'Job Opportunity',
      'announcement': 'Announcement',
      'training': 'Training',
      'event': 'Event',
      'general': 'General'
    };
    return categoryMap[category] || category;
  };

  // Get priority display name
  const getPriorityDisplayName = (priority) => {
    const priorityMap = {
      'urgent': 'Urgent',
      'high': 'High Priority',
      'medium': 'Medium Priority',
      'low': 'Low Priority'
    };
    return priorityMap[priority] || priority;
  };

  // Get category color
  const getCategoryColor = (category) => {
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
  };

  // Get priority color
  const getPriorityColor = (priority) => {
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
  };

  // Format time ago
  const getTimeAgo = (dateString) => {
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
  };

  // Handle hire staff action
  const handleHireStaff = (notification) => {
    console.log('Notification data for hiring:', notification);
    console.log('Staff data:', notification?.staff);
    setSelectedNotification(notification);
    setShowHireModal(true);
  };

  // Handle send job offer
  const handleSendOffer = async (offerData) => {
    try {
      // Update notification status
      setNotificationStatus(prev => ({
        ...prev,
        [selectedNotification.id]: 'hired'
      }));
      
      // Close modal and show success message
      setShowHireModal(false);
      toast.success(`Job offer sent to ${selectedNotification.staff.name}!`);
      
      // Refresh notifications to update UI
      handleNotificationUpdate();
    } catch (error) {
      console.error('Error sending job offer:', error);
      toast.error('Failed to send job offer');
    }
  };

  // Handle reject application
  const handleRejectApplication = async (notificationId) => {
    try {
      // Call the API to reject the application
      await salonService.rejectStaffApplication(notificationId);
      
      // Update notification status
      setNotificationStatus(prev => ({
        ...prev,
        [notificationId]: 'rejected'
      }));
      
      toast.success('Application marked as unsuitable');
      
      // Refresh notifications to update UI
      handleNotificationUpdate();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    }
  };

  // Handle reply to notification
  const handleReplyToNotification = (notification) => {
    setReplyingTo(notification.id);
  };

  // Handle reply sent
  const handleReplySent = (replyMessage) => {
    // Update notification in the list to show the reply
    setNotifications(prev => prev.map(notification => {
      if (notification.id === replyingTo) {
        // In a real implementation, we would add the reply to the notification thread
        // For now, we'll just close the reply form
        return notification;
      }
      return notification;
    }));
    
    setReplyingTo(null);
    
    // Refresh notifications to show the new reply
    handleNotificationUpdate();
  };

  // Render notification item
  const renderNotificationItem = (notification) => {
    console.log('Rendering notification:', notification);
    const timeAgo = getTimeAgo(notification.sentAt);
    const categoryColor = getCategoryColor(notification.category);
    const priorityColor = getPriorityColor(notification.priority);
    const status = notificationStatus[notification.id] || 'active'; // active, hired, rejected

    // Skip rendering if rejected and filter is applied
    if (status === 'rejected') {
      return null;
    }

    return (
      <div className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-md ${
        !notification.isRead ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : 'border-gray-200'
      } ${notification.isArchived ? 'opacity-75' : ''} ${status === 'rejected' ? 'opacity-50' : ''}`}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-1">
                {notification.isArchived ? (
                  <Archive className="h-5 w-5 text-gray-400" />
                ) : notification.isRead ? (
                  <MailOpen className="h-5 w-5 text-gray-600" />
                ) : (
                  <Mail className="h-5 w-5 text-primary-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Subject and Priority */}
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className={`text-sm font-medium truncate ${
                    !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {notification.subject}
                  </h3>
                  <div className={`p-1 rounded ${priorityColor}`}>
                    <AlertCircle className="h-3 w-3" />
                  </div>
                </div>

                {/* Staff Info */}
                <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
                  <User className="h-3 w-3" />
                  <span>{notification.staff?.name || 'Staff Member'}</span>
                  <span>•</span>
                  <Target className="h-3 w-3" />
                  <span>{notification.targetSkill}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{timeAgo}</span>
                </div>

                {/* Category and Type Badges */}
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${categoryColor}`}>
                    {getCategoryDisplayName(notification.category)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                    notification.type === 'direct_message' 
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {notification.type === 'direct_message' ? 'Reply' : 'Broadcast'}
                  </span>
                  {status === 'hired' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Hired
                    </span>
                  )}
                  {status === 'rejected' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </span>
                  )}
                </div>

                {/* Message Preview */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {notification.message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {!notification.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Mark as Read"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4 space-y-4">
            {/* Full Message */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Message:</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {notification.message}
                </p>
              </div>
            </div>

            {/* Staff Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">From:</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{notification.staff?.name || 'Staff Member'}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Email: {notification.staff?.email || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Position: {notification.staff?.position || 'N/A'}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">Sent:</span> {new Date(notification.sentAt).toLocaleString()}
              </div>
              {notification.readAt && (
                <div>
                  <span className="font-medium">Read:</span> {new Date(notification.readAt).toLocaleString()}
                </div>
              )}
              <div>
                <span className="font-medium">Target Skill:</span> {notification.targetSkill}
              </div>
              <div>
                <span className="font-medium">Category:</span> {getCategoryDisplayName(notification.category)}
              </div>
            </div>

            {/* Reply Form - Show only if replying to this notification */}
            {replyingTo === notification.id && (
              <NotificationReply
                notification={notification}
                onReplySent={handleReplySent}
                onCancel={() => setReplyingTo(null)}
              />
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => handleReplyToNotification(notification)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </button>
                <button
                  onClick={() => handleHireStaff(notification)}
                  className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Hire / Offer Job
                </button>
                <button
                  onClick={() => handleRejectApplication(notification.id)}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Mark as Unsuitable
                </button>
              </div>
              
              <div className="text-xs text-gray-500">
                ID: {notification.id.slice(-8)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Replies & Notifications</h1>
              <p className="text-gray-600">Messages and replies from your staff members</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Inbox className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.unread}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Read</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.read}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Archive className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Read Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.readRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                  showFilters ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </form>

          {/* Filter options */}
          {showFilters && (
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Category filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Categories</option>
                    <option value="opportunity">Job Opportunities</option>
                    <option value="announcement">Announcements</option>
                    <option value="training">Training</option>
                    <option value="event">Events</option>
                    <option value="general">General</option>
                  </select>
                </div>

                {/* Type filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Types</option>
                    <option value="direct_message">Replies</option>
                    <option value="broadcast">Broadcasts</option>
                  </select>
                </div>

                {/* Unread only filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.unreadOnly}
                      onChange={(e) => handleFilterChange('unreadOnly', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Unread only</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear All Filters
                </button>
                
                {stats.unread > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Mark All as Read ({stats.unread})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => loadNotifications()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Notifications List */}
        {!loading && !error && (
          <>
            {notifications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <BellOff className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications Found</h3>
                <p className="text-gray-600 mb-4">
                  {Object.values(filters).some(f => f) 
                    ? "No notifications match your current filters. Try adjusting your search criteria."
                    : "You don't have any notifications yet. Staff members will send you replies here."
                  }
                </p>
                {Object.values(filters).some(f => f) && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {notifications.map(notification => (
                  notification ? renderNotificationItem(notification) : null
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border p-4">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} notifications
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Hire Staff Modal */}
      <HireStaffModal
        isOpen={showHireModal}
        onClose={() => setShowHireModal(false)}
        staffMember={selectedNotification?.staff}
        onSendOffer={handleSendOffer}
      />
    </div>
  );
};

export default SalonNotifications;