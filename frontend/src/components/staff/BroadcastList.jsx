import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Mail, 
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
  AlertCircle
} from 'lucide-react';
import { staffNotificationService } from '../../services/staffNotification';
import BroadcastItem from './BroadcastItem';
import BroadcastReplyModal from './BroadcastReplyModal';

const BroadcastList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
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
    includeArchived: false
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    readRate: 0
  });

  const [showFilters, setShowFilters] = useState(false);

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
        includeArchived: newFilters.includeArchived
      };

      console.log('🔄 Loading notifications with options:', options);
      const response = await staffNotificationService.getNotifications(options);

      if (response.success) {
        let notificationList = response.data.notifications || [];
        
        // Apply client-side search filter
        if (newFilters.search) {
          notificationList = staffNotificationService.filterNotifications(
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

  const handleReply = (notification) => {
    setSelectedNotification(notification);
    setIsReplyModalOpen(true);
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

      await staffNotificationService.markMultipleAsRead(unreadIds);
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
      includeArchived: false
    };
    setFilters(clearedFilters);
    loadNotifications(1, clearedFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Broadcasts & Notifications</h1>
              <p className="text-gray-600">Messages and announcements from salon owners</p>
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
                    {staffNotificationService.getAvailableCategories().map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
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

                {/* Include archived filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Archive</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.includeArchived}
                      onChange={(e) => handleFilterChange('includeArchived', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include archived</span>
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
                    : "You don't have any notifications yet. Salon owners will send you broadcasts here."
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
                  <BroadcastItem
                    key={notification.id}
                    notification={notification}
                    onUpdate={handleNotificationUpdate}
                    onReply={() => handleReply(notification)}
                  />
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

        <BroadcastReplyModal
          isOpen={isReplyModalOpen}
          onClose={() => setIsReplyModalOpen(false)}
          notification={selectedNotification}
          onSuccess={() => {
            setIsReplyModalOpen(false);
            toast.success('Reply sent successfully!');
          }}
        />
      </div>
    </div>
  );
};

export default BroadcastList;
